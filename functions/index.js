const admin = require("firebase-admin");
const { defineString } = require("firebase-functions/params");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { setGlobalOptions } = require("firebase-functions/v2");
const { GoogleGenerativeAI } = require("@google/generative-ai");

setGlobalOptions({ region: "asia-south1" });

admin.initializeApp();
const db = admin.firestore();

const GEMINI_KEY = defineString("GEMINI_KEY");

function getGemini() {
  return new GoogleGenerativeAI(GEMINI_KEY.value());
}

function getPriority(level) {
  if (level === "red") return 1;
  if (level === "yellow") return 2;
  return 3;
}

/* When citizen uploads before-clean image */
exports.onReportUpload = onObjectFinalized(async (event) => {
  const object = event.data;
  const fileUrl = object.mediaLink;
  if (!fileUrl) return;

  console.log("Triggered for file:", fileUrl);

  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt =
    "Check this image:\n" +
    "1) Is there garbage? yes/no\n" +
    "2) Dry or wet?\n" +
    "3) Level: red, yellow, or green\n" +
    "Reply ONLY in JSON like:\n" +
    "{ waste: 'yes/no', type: 'dry/wet', level: 'red/yellow/green' }";

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (e) {
    console.log("Gemini failed:", e);
    return;
  }

  const text = result.response.text();
  console.log("AI raw text:", text);

  let data;
  try {
    data = JSON.parse(text.replace(/'/g, '"'));
  } catch {
    console.log("AI response not JSON:", text);
    return;
  }

  const snap = await db.collection("reports")
    .where("imageBefore", "==", fileUrl)
    .get();

  if (snap.empty) return;

  const reportDoc = snap.docs[0];
  const report = reportDoc.data();

  const isReal = data.waste === "yes";

  await reportDoc.ref.update({
    wasteDetected: data.waste,
    wasteType: data.type,
    level: data.level,
    priority: getPriority(data.level),
    status: isReal ? "assigned" : "fake",
    history: admin.firestore.FieldValue.arrayUnion({
      status: isReal ? "assigned" : "fake",
      time: admin.firestore.FieldValue.serverTimestamp()
    })
  });

  console.log("Report updated:", reportDoc.id);

  // POINTS LOGIC
  if (isReal) {
    // Real report → +2
    await db.doc("users/" + report.citizenId)
      .update({ points: admin.firestore.FieldValue.increment(2) });
  }
  // Fake → 0 points (do nothing)
});

/* When cleaner uploads after-clean image */
exports.onAfterCleanUpload = onObjectFinalized(async (event) => {
  const object = event.data;
  const fileUrl = object.mediaLink;
  if (!fileUrl) return;

  console.log("After-clean file:", fileUrl);

  const snap = await db.collection("reports")
    .where("imageAfter", "==", fileUrl)
    .get();
  if (snap.empty) return;

  const reportDoc = snap.docs[0];
  const report = reportDoc.data();

  const genAI = getGemini();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Is the area clean now? Reply only yes or no.";

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (e) {
    console.log("Gemini failed:", e);
    return;
  }

  const cleaned = result.response.text().toLowerCase().includes("yes");
  console.log("Clean result:", cleaned);

  if (cleaned) {
    await reportDoc.ref.update({
      status: "verified",
      history: admin.firestore.FieldValue.arrayUnion({
        status: "verified",
        time: admin.firestore.FieldValue.serverTimestamp()
      })
    });

    console.log("Verified report:", reportDoc.id);

    // POINTS LOGIC
    // Citizen → +2 for cleaned
    await db.doc("users/" + report.citizenId)
      .update({ points: admin.firestore.FieldValue.increment(2) });

    // Sweeper → +2 for cleaning
    await db.doc("users/" + report.assignedSweeper)
      .update({ points: admin.firestore.FieldValue.increment(2) });
  }
});
