
import { supabase } from "../lib/supabase";
import fs from "fs";

export default async function handler(req, res) {
  const { token, hwid } = req.query;

  if (!token || !hwid) {
    return res.json({ success: false });
  }

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("session_token", token)
    .single();

  if (!data) {
    return res.json({ success: false, reason: "bad_token" });
  }

  if (data.hwid !== hwid) {
    return res.json({ success: false, reason: "hwid_mismatch" });
  }

  if (new Date(data.token_expire) < new Date()) {
    return res.json({ success: false, reason: "expired" });
  }

  const script = fs.readFileSync("./scripts/main.lua", "utf8");

  res.setHeader("Content-Type", "text/plain");
  return res.send(script);
}
