import { NextResponse } from "next/server";

import { getServerCloudBaseApp } from "@/lib/cloudbase/server";
import { buildCrewRecords, buildProgressRecord, buildSaveSummary, buildWorkRecords } from "@/lib/cloud-save/serializers";
import type {
  CloudCrewRecord,
  CloudProgressRecord,
  CloudSavePayload,
  CloudSnapshot,
  CloudUserRecord,
  CloudWorkRecord
} from "@/types/cloud-save";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const USER_COLLECTION = "users";
const WORK_COLLECTION = "works";
const CREW_COLLECTION = "crews";
const PROGRESS_COLLECTION = "progress";

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function ensureCollection(db: ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>, name: string) {
  try {
    await db.createCollection(name);
  } catch {
    // already exists or runtime does not need an explicit create
  }
}

async function ensureCollections(db: ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>) {
  await Promise.all([
    ensureCollection(db, USER_COLLECTION),
    ensureCollection(db, WORK_COLLECTION),
    ensureCollection(db, CREW_COLLECTION),
    ensureCollection(db, PROGRESS_COLLECTION)
  ]);
}

function firstDoc<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? (data[0] as T) : null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function upsertUser(
  db: ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>,
  authUid: string,
  loginType: string,
  options?: {
    email?: string | null;
    isAnonymous?: boolean;
    upgradedFromAuthUids?: string[];
    upgradedToAuthUid?: string | null;
    boundAt?: number | null;
  }
) {
  const now = Date.now();
  const existing = firstDoc<CloudUserRecord>((await db.collection(USER_COLLECTION).doc(authUid).get()).data);
  const email = options?.email?.trim() ?? existing?.email ?? null;
  const user: CloudUserRecord = {
    _id: authUid,
    authUid,
    loginType: email ? "EMAIL" : loginType,
    email,
    isAnonymous: email ? false : (options?.isAnonymous ?? (existing?.isAnonymous ?? loginType === "ANONYMOUS")),
    upgradedFromAuthUids: uniqueValues([...(existing?.upgradedFromAuthUids ?? []), ...(options?.upgradedFromAuthUids ?? [])]),
    upgradedToAuthUid: options?.upgradedToAuthUid ?? existing?.upgradedToAuthUid ?? null,
    boundAt: options?.boundAt ?? existing?.boundAt ?? (email ? now : null),
    createdAt: existing?.createdAt ?? now,
    lastLoginAt: now
  };

  await db.collection(USER_COLLECTION).doc(authUid).set({
    authUid: user.authUid,
    loginType: user.loginType,
    email: user.email,
    isAnonymous: user.isAnonymous,
    upgradedFromAuthUids: user.upgradedFromAuthUids,
    upgradedToAuthUid: user.upgradedToAuthUid,
    boundAt: user.boundAt,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  });

  return user;
}

async function removeStaleDocs(
  records: Array<{ _id: string }>,
  existing: Array<{ _id: string }>,
  collection: ReturnType<ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>["collection"]>
) {
  const keep = new Set(records.map((item) => item._id));
  const stale = existing.filter((item) => !keep.has(item._id));

  await Promise.all(stale.map((item) => collection.doc(item._id).remove().catch(() => null)));
}

async function readSnapshot(
  db: ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>,
  user: CloudUserRecord
): Promise<CloudSnapshot> {
  const progressRes = await db.collection(PROGRESS_COLLECTION).doc(`${user._id}:main`).get();
  const progress = firstDoc<CloudProgressRecord>(progressRes.data);
  const [crewsRes, worksRes] = await Promise.all([
    db.collection(CREW_COLLECTION).where({ userId: user._id }).get(),
    db.collection(WORK_COLLECTION).where({ userId: user._id }).get()
  ]);

  return {
    user,
    crews: (crewsRes.data ?? []) as CloudCrewRecord[],
    works: (worksRes.data ?? []) as CloudWorkRecord[],
    progress
  };
}

async function getDatabase() {
  const app = getServerCloudBaseApp();

  if (!app) {
    throw new Error("CloudBase 服务端环境尚未配置。");
  }

  const db = app.database();
  await ensureCollections(db);
  return db;
}

function buildLocalOnlyUser(authUid: string, loginType: string, email?: string | null): CloudUserRecord {
  const now = Date.now();
  const normalizedEmail = email?.trim() || null;

  return {
    _id: authUid,
    authUid,
    loginType: normalizedEmail ? "EMAIL" : loginType,
    email: normalizedEmail,
    isAnonymous: !normalizedEmail,
    upgradedFromAuthUids: [],
    upgradedToAuthUid: null,
    boundAt: normalizedEmail ? now : null,
    createdAt: now,
    lastLoginAt: now
  };
}

function buildLocalOnlySaveMeta(body: CloudSavePayload) {
  const works = buildWorkRecords(body.state, body.authUid, {
    repairedSignal: body.state.signalMission.repairedSignal,
    chapterTwoOutcome: body.state.chapterTwo.outcome
  });
  const summary = buildSaveSummary(body.state, works);

  return {
    updatedAt: summary.lastSavedAt,
    crewCount: buildCrewRecords(body.state, body.authUid).length,
    workCount: works.length,
    summary
  };
}

export async function GET(request: Request) {
  try {
    const authUid = new URL(request.url).searchParams.get("authUid")?.trim();
    const loginType = new URL(request.url).searchParams.get("loginType")?.trim() ?? "ANONYMOUS";

    if (!authUid) {
      return NextResponse.json({ ok: false, error: "缺少 authUid。" }, { status: 400 });
    }

    const token = readBearerToken(request);
    if (!token) {
      return NextResponse.json({ ok: false, error: "缺少登录凭证。" }, { status: 401 });
    }

    const app = getServerCloudBaseApp();

    if (!app) {
      return NextResponse.json({
        ok: true,
        cloudDisabled: true,
        snapshot: {
          user: buildLocalOnlyUser(authUid, loginType),
          crews: [],
          works: [],
          progress: null
        }
      });
    }

    const db = app.database();
    await ensureCollections(db);
    const user = await upsertUser(db, authUid, loginType);
    const snapshot = await readSnapshot(db, user);

    return NextResponse.json({
      ok: true,
      snapshot
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "云端存档读取失败。"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = readBearerToken(request);
    if (!token) {
      return NextResponse.json({ ok: false, error: "缺少登录凭证。" }, { status: 401 });
    }

    const body = (await request.json()) as CloudSavePayload;
    if (!body?.authUid || !body?.state) {
      return NextResponse.json({ ok: false, error: "无效的云端存档请求。" }, { status: 400 });
    }

    const app = getServerCloudBaseApp();

    if (!app) {
      return NextResponse.json({
        ok: true,
        cloudDisabled: true,
        saveMeta: buildLocalOnlySaveMeta(body)
      });
    }

    const db = app.database();
    await ensureCollections(db);
    const user = await upsertUser(db, body.authUid, body.loginType ?? "ANONYMOUS", {
      email: body.email,
      isAnonymous: body.isAnonymous
    });

    const [existingCrewsRes, existingWorksRes, existingProgressRes] = await Promise.all([
      db.collection(CREW_COLLECTION).where({ userId: user._id }).get(),
      db.collection(WORK_COLLECTION).where({ userId: user._id }).get(),
      db.collection(PROGRESS_COLLECTION).doc(`${user._id}:main`).get()
    ]);

    const existingCrewMap = new Map<string, CloudCrewRecord>(
      ((existingCrewsRes.data ?? []) as CloudCrewRecord[]).map((item) => [item._id, item])
    );
    const existingWorkMap = new Map<string, CloudWorkRecord>(
      ((existingWorksRes.data ?? []) as CloudWorkRecord[]).map((item) => [item._id, item])
    );
    const existingProgress = firstDoc<CloudProgressRecord>(existingProgressRes.data);

    const crews = buildCrewRecords(body.state, user._id, existingCrewMap);
    const works = buildWorkRecords(
      body.state,
      user._id,
      {
        repairedSignal: body.state.signalMission.repairedSignal,
        chapterTwoOutcome: body.state.chapterTwo.outcome
      },
      existingWorkMap
    );
    const progress = buildProgressRecord(body.state, user._id, existingProgress);

    await Promise.all([
      ...crews.map((crew) =>
        db.collection(CREW_COLLECTION).doc(crew._id).set({
          userId: crew.userId,
          name: crew.name,
          profile: crew.profile,
          echoes: crew.echoes,
          bond: crew.bond,
          metadata: crew.metadata,
          createdAt: crew.createdAt,
          updatedAt: crew.updatedAt
        })
      ),
      ...works.map((work) =>
        db.collection(WORK_COLLECTION).doc(work._id).set({
          userId: work.userId,
          type: work.type,
          title: work.title,
          content: work.content,
          metadata: work.metadata,
          createdAt: work.createdAt,
          updatedAt: work.updatedAt
        })
      ),
      db.collection(PROGRESS_COLLECTION).doc(progress._id).set({
        userId: progress.userId,
        chapter: progress.chapter,
        memoryVault: progress.memoryVault,
        planetUnlocked: progress.planetUnlocked,
        faultRunState: progress.faultRunState,
        progression: progress.progression,
        generatedCrewId: progress.generatedCrewId,
        recruitState: progress.recruitState,
        planetCatalog: progress.planetCatalog,
        faultCaseRecords: progress.faultCaseRecords,
        taskDesk: progress.taskDesk,
        chapterTwoState: progress.chapterTwoState,
        shipLogs: progress.shipLogs,
        shipStatusNote: progress.shipStatusNote,
        summary: progress.summary,
        updatedAt: progress.updatedAt
      })
    ]);

    await Promise.all([
      removeStaleDocs(crews, (existingCrewsRes.data ?? []) as Array<{ _id: string }>, db.collection(CREW_COLLECTION)),
      removeStaleDocs(works, (existingWorksRes.data ?? []) as Array<{ _id: string }>, db.collection(WORK_COLLECTION))
    ]);

    return NextResponse.json({
      ok: true,
      saveMeta: {
        updatedAt: progress.updatedAt,
        crewCount: crews.length,
        workCount: works.length,
        summary: progress.summary
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "云端存档写入失败。"
      },
      { status: 500 }
    );
  }
}
