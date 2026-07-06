
import { supabase } from "../lib/supabase";
import crypto from "crypto";

function genToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export default async function handler(req, res) {
  const { key, id, hwid } = req.query;

  const now = new Date();

  if (!key || !id || !hwid) {
    return res.json({ success: false, reason: "missing" });
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("key", key)
    .single();

  if (!data) {
    return res.json({ success: false, reason: "invalid_key" });
  }

  if (data.hwid && data.hwid !== hwid) {
    return res.json({ success: false, reason: "hwid_mismatch" });
  }

  if (!data.hwid) {
    await supabase.from("users")
      .update({ hwid })
      .eq("key", key);
  }

  const token = genToken();
  const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 นาที

  await supabase.from("users")
    .update({
      session_token: token,
      token_expire: expire
    })
    .eq("key", key);

  return res.json({
    success: true,
    token,
    expire,
    server_time: now.toISOString()
  });
    }
