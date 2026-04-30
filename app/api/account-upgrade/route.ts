import { NextResponse } from "next/server";

import { getServerCloudBaseApp } from "@/lib/cloudbase/server";
import type {
  CloudAccountUpgradePayload,
  CloudAccountUpgradeResponse,
  CloudCrewRecord,
  CloudProgressRecord,
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

function firstDoc<T>(data: unknown): T | null {
  return Array.isArray(data) && data.length > 0 ? (data[0] as T) : null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function ensureCollection(db: ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>, name: string) {
  try {
    await db.createCollection(name);
  } catch {
    // ignore if it already exists
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

async function getDatabase() {
  const app = getServerCloudBaseApp();

  if (!app) {
    throw new Error("CloudBase 服务端环境尚未配置。");
  }

  const db = app.database();
  await ensureCollections(db);
  return db;
}

async function writeCrewRecord(
  collection: ReturnType<ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>["collection"]>,
  record: CloudCrewRecord
) {
  await collection.doc(record._id).set({
    userId: record.userId,
    name: record.name,
    profile: record.profile,
    echoes: record.echoes,
    bond: record.bond,
    metadata: record.metadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
}

async function writeWorkRecord(
  collection: ReturnType<ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>["collection"]>,
  record: CloudWorkRecord
) {
  await collection.doc(record._id).set({
    userId: record.userId,
    type: record.type,
    title: record.title,
    content: record.content,
    metadata: record.metadata,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  });
}

async function writeProgressRecord(
  collection: ReturnType<ReturnType<NonNullable<ReturnType<typeof getServerCloudBaseApp>>["database"]>["collection"]>,
  record: CloudProgressRecord
) {
  await collection.doc(record._id).set({
    userId: record.userId,
    chapter: record.chapter,
    memoryVault: record.memoryVault,
    planetUnlocked: record.planetUnlocked,
    faultRunState: record.faultRunState,
    progression: record.progression,
    generatedCrewId: record.generatedCrewId,
    recruitState: record.recruitState,
    planetCatalog: record.planetCatalog,
    faultCaseRecords: record.faultCaseRecords,
    taskDesk: record.taskDesk,
    chapterTwoState: record.chapterTwoState,
    shipLogs: record.shipLogs,
    shipStatusNote: record.shipStatusNote,
    summary: record.summary,
    updatedAt: record.updatedAt
  });
}

export async function POST(request: Request) {
  try {
    const token = readBearerToken(request);
    if (!token) {
      return NextResponse.json({ ok: false, error: "缺少登录凭证。" } satisfies CloudAccountUpgradeResponse, { status: 401 });
    }

    const body = (await request.json()) as CloudAccountUpgradePayload;
    const previousAuthUid = body.previousAuthUid?.trim();
    const nextAuthUid = body.nextAuthUid?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!previousAuthUid || !nextAuthUid || !email) {
      return NextResponse.json({ ok: false, error: "升级请求缺少必要字段。" } satisfies CloudAccountUpgradeResponse, { status: 400 });
    }

    const db = await getDatabase();
    const now = Date.now();
    const users = db.collection(USER_COLLECTION);
    const crewsCollection = db.collection(CREW_COLLECTION);
    const worksCollection = db.collection(WORK_COLLECTION);
    const progressCollection = db.collection(PROGRESS_COLLECTION);

    const [previousUserRes, nextUserRes, crewsRes, worksRes, progressRes] = await Promise.all([
      users.doc(previousAuthUid).get(),
      users.doc(nextAuthUid).get(),
      crewsCollection.where({ userId: previousAuthUid }).get(),
      worksCollection.where({ userId: previousAuthUid }).get(),
      progressCollection.doc(`${previousAuthUid}:main`).get()
    ]);

    const previousUser = firstDoc<CloudUserRecord>(previousUserRes.data);
    const nextUserExisting = firstDoc<CloudUserRecord>(nextUserRes.data);
    const previousCrews = (crewsRes.data ?? []) as CloudCrewRecord[];
    const previousWorks = (worksRes.data ?? []) as CloudWorkRecord[];
    const previousProgress = firstDoc<CloudProgressRecord>(progressRes.data);

    const upgradedFromAuthUids = uniqueValues([
      ...(nextUserExisting?.upgradedFromAuthUids ?? []),
      ...(previousUser?.upgradedFromAuthUids ?? []),
      previousAuthUid !== nextAuthUid ? previousAuthUid : null
    ]);

    const upgradedUser: CloudUserRecord = {
      _id: nextAuthUid,
      authUid: nextAuthUid,
      loginType: body.loginType?.trim() || "EMAIL",
      email,
      isAnonymous: false,
      upgradedFromAuthUids,
      upgradedToAuthUid: null,
      boundAt: nextUserExisting?.boundAt ?? previousUser?.boundAt ?? now,
      createdAt: nextUserExisting?.createdAt ?? previousUser?.createdAt ?? now,
      lastLoginAt: now
    };

    await users.doc(nextAuthUid).set({
      authUid: upgradedUser.authUid,
      loginType: upgradedUser.loginType,
      email: upgradedUser.email,
      isAnonymous: upgradedUser.isAnonymous,
      upgradedFromAuthUids: upgradedUser.upgradedFromAuthUids,
      upgradedToAuthUid: upgradedUser.upgradedToAuthUid,
      boundAt: upgradedUser.boundAt,
      createdAt: upgradedUser.createdAt,
      lastLoginAt: upgradedUser.lastLoginAt
    });

    if (previousAuthUid !== nextAuthUid) {
      await Promise.all([
        ...previousCrews.map((record) =>
          writeCrewRecord(crewsCollection, {
            ...record,
            _id: `${nextAuthUid}:${record.profile.id}`,
            userId: nextAuthUid,
            updatedAt: now
          })
        ),
        ...previousWorks.map((record) =>
          writeWorkRecord(worksCollection, {
            ...record,
            _id: record._id.replace(previousAuthUid, nextAuthUid),
            userId: nextAuthUid,
            updatedAt: now
          })
        ),
        previousProgress
          ? writeProgressRecord(progressCollection, {
              ...previousProgress,
              _id: `${nextAuthUid}:main`,
              userId: nextAuthUid,
              updatedAt: now,
              summary: {
                ...previousProgress.summary,
                lastSavedAt: now
              }
            })
          : Promise.resolve(),
        users.doc(previousAuthUid).set({
          authUid: previousAuthUid,
          loginType: previousUser?.loginType ?? "ANONYMOUS",
          email: previousUser?.email ?? null,
          isAnonymous: previousUser?.isAnonymous ?? true,
          upgradedFromAuthUids: previousUser?.upgradedFromAuthUids ?? [],
          upgradedToAuthUid: nextAuthUid,
          boundAt: previousUser?.boundAt ?? null,
          createdAt: previousUser?.createdAt ?? now,
          lastLoginAt: previousUser?.lastLoginAt ?? now
        }),
        ...previousCrews.map((record) => crewsCollection.doc(record._id).remove().catch(() => null)),
        ...previousWorks.map((record) => worksCollection.doc(record._id).remove().catch(() => null)),
        progressCollection.doc(`${previousAuthUid}:main`).remove().catch(() => null)
      ]);
    }

    return NextResponse.json({
      ok: true,
      user: upgradedUser
    } satisfies CloudAccountUpgradeResponse);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "正式账号升级失败。"
      } satisfies CloudAccountUpgradeResponse,
      { status: 500 }
    );
  }
}
