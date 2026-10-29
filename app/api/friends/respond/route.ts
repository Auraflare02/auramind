import { createClient } from "@/lib/supabase/server";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
} from "@/lib/friends/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required." }, { status: 400 });
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
    }

    let result;
    switch (action.toLowerCase()) {
      case "accept":
        result = await acceptFriendRequest(user.id, targetUserId);
        break;
      case "reject":
        result = await rejectFriendRequest(user.id, targetUserId);
        break;
      case "cancel":
        result = await cancelFriendRequest(user.id, targetUserId);
        break;
      case "remove":
        result = await removeFriend(user.id, targetUserId);
        break;
      case "block":
        result = await blockUser(user.id, targetUserId);
        break;
      case "unblock":
        result = await unblockUser(user.id, targetUserId);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: '${action}'. Expected accept, reject, cancel, remove, block, or unblock.` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/friends/respond]", err);
    return NextResponse.json(
      { error: err.message || "Failed to process friendship action." },
      { status: 400 }
    );
  }
}
