const admin = require("firebase-admin");
const { defineString } = require("firebase-functions/params");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { setGlobalOptions } = require("firebase-functions/v2");
const { GoogleGenerativeAI } = require("@google/generative-ai");

setGlobalOptions({ region: "asia-south1" });

admin.initializeApp();
const db = admin.firestore();

const GEMINI_KEY = defineString("GEMINI_KEY");

// Use Gemini 1.5 Flash (fast and efficient for image analysis)
// Available models: "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"
const GEMINI_MODEL = "gemini-1.5-flash";

function getGemini() {
  return new GoogleGenerativeAI(GEMINI_KEY.value());
}

function getPriority(level) {
  if (level === "red") return 1;
  if (level === "yellow") return 2;
  return 3;
}

/**
 * Download image from Firebase Storage and convert to base64 for Gemini
 * Uses Firebase Admin SDK for authenticated access
 */
async function downloadImageAsBase64(imageUrl) {
  try {
    let bucketName, filePath;
    
    // Check if it's a gs:// URL
    if (imageUrl.startsWith('gs://')) {
      const gsMatch = imageUrl.match(/^gs:\/\/([^\/]+)\/(.+)$/);
      if (gsMatch) {
        bucketName = gsMatch[1];
        filePath = gsMatch[2];
      } else {
        throw new Error("Invalid gs:// URL format");
      }
    } 
    // Check if it's a download URL (storage.googleapis.com)
    else if (imageUrl.includes('storage.googleapis.com')) {
      const urlMatch = imageUrl.match(/\/b\/([^\/]+)\/o\/([^?]+)/);
      if (urlMatch) {
        bucketName = urlMatch[1];
        filePath = decodeURIComponent(urlMatch[2].replace(/%2F/g, '/'));
      } else {
        throw new Error("Could not parse storage.googleapis.com URL");
      }
    }
    // Check if it's a firebasestorage.googleapis.com URL
    else if (imageUrl.includes('firebasestorage.googleapis.com')) {
      const urlMatch = imageUrl.match(/\/b\/([^\/]+)\/o\/([^?]+)/);
      if (urlMatch) {
        bucketName = urlMatch[1];
        filePath = decodeURIComponent(urlMatch[2].replace(/%2F/g, '/'));
      } else {
        throw new Error("Could not parse firebasestorage.googleapis.com URL");
      }
    }
    else {
      throw new Error("Unsupported URL format: " + imageUrl);
    }
    
    console.log("📥 Downloading from bucket:", bucketName, "path:", filePath);
    
    // Use Firebase Admin SDK to download the file
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Download file as buffer
    const [buffer] = await file.download();
    const base64 = buffer.toString('base64');
    
    // Get file metadata for MIME type
    const [metadata] = await file.getMetadata();
    const mimeType = metadata.contentType || 'image/jpeg';
    
    console.log("✅ Image downloaded successfully, size:", buffer.length, "bytes, type:", mimeType);
    
    return { base64, mimeType };
  } catch (error) {
    console.error("❌ Error downloading image from Storage:", error);
    console.error("   File URL:", imageUrl);
    throw new Error("Failed to download image: " + error.message);
  }
}

/**
 * Enhanced AI Analysis for Before-Clean Images
 * Includes: Image validation, Waste detection, Dry/Wet classification, Severity assessment
 */
async function analyzeWasteImage(imageUrl, model) {
  try {
    // Download and convert image
    const { base64, mimeType } = await downloadImageAsBase64(imageUrl);

    const prompt = `You are an EXPERT waste management AI inspector. Analyze this image with EXTREME PRECISION. Your job is to detect REAL waste and classify it accurately.

═══════════════════════════════════════════════════════════════
PART 1: FAKE/STOCK PHOTO DETECTION (CRITICAL - BE VERY STRICT)
═══════════════════════════════════════════════════════════════

⚠️ CRITICAL: You MUST reject fake/stock photos. Be EXTREMELY strict.

Look for these RED FLAGS that indicate FAKE/STOCK photos:
1. Professional photography quality:
   - Perfect lighting, studio-like conditions
   - High-end camera quality (DSLR look)
   - Professional composition/framing
   - Too clean or staged appearance
   - Perfect focus on all objects

2. Stock photo characteristics:
   - Watermarks (Getty Images, Shutterstock, etc.)
   - Perfect focus on all objects
   - Unrealistic cleanliness around waste
   - Generic/stock photo backgrounds
   - Multiple waste items perfectly arranged
   - Professional color grading/editing

3. Internet/downloaded indicators:
   - Screenshot artifacts (borders, UI elements, browser chrome)
   - Low resolution but perfect quality (compressed)
   - Different image quality than phone camera
   - Looks like it was downloaded from Google Images
   - Has text overlays or watermarks

4. Real phone photo indicators (GOOD signs - accept these):
   - Slight blur or motion (natural phone camera)
   - Natural lighting (sunlight, shadows, real environment)
   - Imperfect framing (not perfectly centered)
   - Realistic environment (dirty ground, real location, natural setting)
   - Phone camera quality (not professional DSLR)
   - Real-world context (people, vehicles, buildings in background)

DECISION RULES:
- isFake = true if ANY fake indicator is present (be strict!)
- isFake = false ONLY if it clearly looks like a real phone photo taken on-site
- When in doubt, REJECT (isFake = true) - better to reject than accept fake images

═══════════════════════════════════════════════════════════════
PART 2: REAL WASTE DETECTION (MANDATORY - BE STRICT)
═══════════════════════════════════════════════════════════════

REAL WASTE means actual physical garbage visible in the image:
- Plastic bottles, bags, containers
- Food scraps, organic waste
- Paper, cardboard
- Metal cans, glass bottles
- Construction debris
- Electronic waste

NOT waste (reject these):
- Clean empty containers in recycling bins
- Organized items (not garbage)
- Natural materials (leaves, branches) unless clearly dumped
- Clean surfaces with no visible waste

DECISION: wasteDetected = "yes" ONLY if you see actual garbage/waste
          wasteDetected = "no" if no visible waste

═══════════════════════════════════════════════════════════════
PART 3: DRY/WET CLASSIFICATION (CRITICAL - BE PRECISE)
═══════════════════════════════════════════════════════════════

⚠️ CRITICAL: You MUST classify waste as "dry", "wet", or "mixed". DO NOT return "unknown" or skip classification.

You MUST look at the ACTUAL MATERIALS in the image. DO NOT GUESS. Look at what you ACTUALLY SEE.

DRY WASTE (classification: "dry"):
Examples you should see:
- Plastic bottles (empty, dry, no liquid)
- Plastic bags (clean, dry, no food residue)
- Paper, newspapers, cardboard (dry, not wet)
- Metal cans (empty, dry, no liquid)
- Glass bottles (empty, dry)
- Textiles, cloth (dry, not wet)
- Rubber, tires (dry)
- Dry packaging materials (boxes, containers - empty and dry)

Key indicators:
- No visible moisture (dry surfaces)
- No food/organic matter visible
- Clean, dry materials
- Recyclable items (bottles, cans, paper)
- Items that are NOT decomposing

WET WASTE (classification: "wet"):
Examples you should see:
- Food scraps (vegetables, fruits, leftovers, cooked food)
- Organic matter (rotting food, kitchen waste, food waste)
- Liquid waste (spilled liquids, wet materials, puddles)
- Garden waste (wet leaves, wet organic matter, compost)
- Wet/rotting materials (decomposing organic matter)
- Compostable waste (food, organic materials)

Key indicators:
- Visible moisture/wetness (wet surfaces, liquids)
- Food/organic matter present (vegetables, fruits, food scraps)
- Rotting/decomposing materials (brown, mushy, organic)
- Kitchen/garden waste (compostable materials)
- Items that ARE decomposing or organic

MIXED WASTE (classification: "mixed"):
- You see BOTH dry AND wet waste clearly visible in the SAME image
- Example: Plastic bottles (dry) + food scraps (wet) together
- Example: Paper (dry) + organic waste (wet) together
- Example: Metal cans (dry) + kitchen waste (wet) together
- Must have clear evidence of BOTH types in the same image
- If you see dry items AND wet items together → "mixed"

DECISION PROCESS (FOLLOW THIS EXACTLY):
1. Look at EVERY visible waste item in the image
2. Identify each item: Is it DRY or WET?
3. Count: How many items are DRY? How many are WET?
4. Decision:
   - If ALL items are dry → classification: "dry"
   - If ALL items are wet → classification: "wet"
   - If you see BOTH dry AND wet items → classification: "mixed"
   - If no waste detected → classification: "none"
5. You MUST choose one: "dry", "wet", "mixed", or "none"
6. DO NOT return "unknown" - look harder and make a decision

BE PRECISE - Look at actual materials, not assumptions! What do you ACTUALLY SEE in the image?

═══════════════════════════════════════════════════════════════
PART 4: SEVERITY ASSESSMENT
═══════════════════════════════════════════════════════════════

RED (urgent):
- Large accumulation (many items, large pile)
- Health hazard (rotting food, medical waste)
- Blocking paths/roads
- Visible pollution/spreading

YELLOW (moderate):
- Moderate amount (small pile, several items)
- Noticeable but manageable
- Should clean soon

GREEN (low):
- Small amount (1-3 items)
- Minimal impact
- Minor cleanup needed

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON ONLY - NO MARKDOWN)
═══════════════════════════════════════════════════════════════

Reply ONLY in valid JSON format (no markdown, no code blocks, no explanations):
{
  "imageValid": true/false,
  "isRealPhoto": true/false,
  "wasteDetected": "yes"/"no",
  "wasteType": "plastic/organic/paper/metal/glass/mixed/construction/electronic/none",
  "wasteAmount": "minimal/moderate/extensive/none",
  "classification": "dry"/"wet"/"mixed"/"none",
  "severity": "red"/"yellow"/"green"/"none",
  "isFake": true/false,
  "confidence": 0.0-1.0,
  "description": "brief description: what waste you see and why you classified it as dry/wet/mixed"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();
    console.log("AI raw response:", text);

    // Clean and parse JSON response
    let cleanedText = text.trim();
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    // Remove any leading/trailing whitespace
    cleanedText = cleanedText.trim();

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Cleaned text:", cleanedText);
      // Fallback: try to extract JSON from text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    // Validate required fields - CRITICAL VALIDATION
    if (!data.wasteDetected) {
      console.error("❌ AI response missing wasteDetected field!");
      data.wasteDetected = "no"; // Default to "no" if missing
    }
    
    if (!data.classification) {
      console.error("❌ AI response missing classification field!");
      // Try to infer from wasteType if classification is missing
      if (data.wasteType) {
        const wasteType = data.wasteType.toLowerCase();
        if (wasteType.includes("organic") || wasteType.includes("food") || wasteType.includes("kitchen")) {
          data.classification = "wet";
        } else if (wasteType.includes("plastic") || wasteType.includes("paper") || wasteType.includes("metal") || wasteType.includes("glass")) {
          data.classification = "dry";
        } else {
          data.classification = "mixed";
        }
        console.log("⚠️ Inferred classification from wasteType:", data.classification);
      } else {
        data.classification = "unknown"; // Last resort
      }
    }
    
    // Ensure classification is valid
    const validClassifications = ["dry", "wet", "mixed", "none"];
    if (!validClassifications.includes(data.classification.toLowerCase())) {
      console.error("❌ Invalid classification from AI:", data.classification);
      data.classification = "unknown";
    } else {
      // Normalize to lowercase
      data.classification = data.classification.toLowerCase();
    }
    
    // Validate isFake field
    if (typeof data.isFake !== "boolean") {
      console.warn("⚠️ AI response isFake is not boolean:", data.isFake);
      data.isFake = false; // Default to false if invalid
    }
    
    // Validate wasteDetected
    if (data.wasteDetected !== "yes" && data.wasteDetected !== "no") {
      console.warn("⚠️ AI response wasteDetected is not yes/no:", data.wasteDetected);
      data.wasteDetected = "no"; // Default to "no" if invalid
    }
    
    console.log("✅ Validated AI response:", {
      wasteDetected: data.wasteDetected,
      classification: data.classification,
      isFake: data.isFake,
      confidence: data.confidence
    });
    
    return data;
  } catch (error) {
    console.error("❌ Error in analyzeWasteImage:", error);
    console.error("   Error details:", error.message);
    if (error.message && (error.message.includes("API key") || error.message.includes("GEMINI_KEY"))) {
      console.error("   ⚠️ GEMINI_KEY might not be set. Run: firebase functions:secrets:set GEMINI_KEY");
    }
    throw error;
  }
}

/**
 * Compare Before and After Images
 * Verifies if cleaning was successful
 */
async function compareBeforeAfter(beforeImageUrl, afterImageUrl, model) {
  try {
    const [beforeImage, afterImage] = await Promise.all([
      downloadImageAsBase64(beforeImageUrl),
      downloadImageAsBase64(afterImageUrl),
    ]);

    const prompt = `You are a waste management verification AI. Compare these two images:

CRITICAL: Image Order is FIXED and MUST be respected:
- FIRST IMAGE (BEFORE): This image was uploaded by a CITIZEN reporting waste/garbage. This shows the location BEFORE cleaning. You should see visible waste, garbage, or debris in this image.
- SECOND IMAGE (AFTER): This image was uploaded by a SWEEPER after cleaning. This shows the SAME location AFTER cleaning. The waste should be removed or significantly reduced.

IMPORTANT RULES:
- DO NOT swap or assume the order - FIRST is always BEFORE (citizen report), SECOND is always AFTER (sweeper cleanup)
- The BEFORE image should show waste/garbage present
- The AFTER image should show the same location with waste removed
- If the AFTER image shows MORE waste than BEFORE, this is suspicious and should be flagged

ANALYSIS REQUIRED:
1. Are both images of the same location/area? (Compare landmarks, buildings, surroundings - must be the same place)
2. Has the waste been cleaned/removed? (Compare BEFORE vs AFTER - waste should be gone or reduced in AFTER image)
3. How clean is the area now? (very clean, mostly clean, partially clean, not clean)
4. Is there any remaining waste in the AFTER image? (yes/no)
5. Quality of cleaning: (excellent, good, fair, poor)
6. Is the AFTER image actually cleaner than BEFORE? (true/false - if false, something is wrong)

VALIDATION CHECKS:
- If AFTER image shows MORE waste than BEFORE → flag as suspicious
- If images are from different locations → flag as invalid
- If AFTER image is identical to BEFORE → flag as reused/fake

Reply ONLY in valid JSON format:
{
  "sameLocation": true/false,
  "cleaned": true/false,
  "cleanlinessLevel": "very clean/mostly clean/partially clean/not clean",
  "remainingWaste": true/false,
  "cleaningQuality": "excellent/good/fair/poor",
  "afterIsCleaner": true/false,
  "suspicious": true/false,
  "suspiciousReason": "string if suspicious, empty if not",
  "confidence": 0.0-1.0,
  "description": "brief comparison description explaining BEFORE vs AFTER"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: beforeImage.base64,
          mimeType: beforeImage.mimeType,
        },
      },
      {
        inlineData: {
          data: afterImage.base64,
          mimeType: afterImage.mimeType,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();
    console.log("Before/After comparison response:", text);

    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse comparison response");
      }
    }

    return data;
  } catch (error) {
    console.error("Error in compareBeforeAfter:", error);
    throw error;
  }
}

/* When citizen uploads before-clean image */
exports.onReportUpload = onObjectFinalized(
  {
    region: "asia-south1",
    // Only process files in reports/ folder that end with _before.jpg
    matchGlob: "reports/**/*_before.jpg"
  },
  async (event) => {
  const object = event.data;
  const filePath = object.name; // e.g., "reports/userId/timestamp_before.jpg"
  const bucketName = object.bucket;
  const fileTimestamp = object.timeCreated; // File creation timestamp
  
  console.log("🔍 AI Analysis triggered for BEFORE image:", filePath);
  
  if (!filePath) {
    console.log("❌ No file path provided");
    return;
  }
  
  // Ensure it's a before image
  if (!filePath.includes("_before.jpg") && !filePath.includes("_before.jpeg")) {
    console.log("⚠️ Skipping - not a before image:", filePath);
    return;
  }

  // Use gs:// URL for Admin SDK access
  const gsUrl = `gs://${bucketName}/${filePath}`;
  console.log("🔍 AI Analysis triggered for file:", gsUrl);
  console.log("📁 File path:", filePath);
  console.log("⏰ File timestamp:", fileTimestamp);

  let genAI;
  let model;
  
  try {
    genAI = getGemini();
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log("✅ Gemini model initialized");
  } catch (error) {
    console.error("❌ Error initializing Gemini:", error);
    console.error("   Make sure GEMINI_KEY is set in Firebase Functions secrets");
    return;
  }

  try {
    // Get public download URL for Firestore matching (no signing needed)
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);
    
    // Use public URL or make file public temporarily
    // For matching, we'll use the gs:// path or construct the public URL
    const downloadUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
    
    // Alternative: Make file public temporarily for AI processing
    try {
      await file.makePublic();
      console.log("✅ Made file public for AI processing");
    } catch (makePublicError) {
      console.log("⚠️ Could not make file public, using public URL format:", makePublicError.message);
    }
    
    // Enhanced AI Analysis - use gs:// URL for Admin SDK
    console.log("🔍 Starting AI analysis for:", gsUrl);
    const analysis = await analyzeWasteImage(gsUrl, model);
    console.log("✅ AI Analysis complete:", JSON.stringify(analysis, null, 2));

    // Find the report document - try multiple ways to find it
    let snap = await db
      .collection("reports")
      .where("imageBefore", "==", downloadUrl)
      .get();
    
    // If not found by exact URL, try to find by checking all recent reports
    if (snap.empty) {
      console.log("⚠️ Report not found by imageBefore URL, trying alternative method...");
      // Get all recent pending reports and match by timestamp or file path
      const recentReports = await db
        .collection("reports")
        .where("status", "==", "pending")
        .limit(50) // Get more reports, sort in memory (no orderBy to avoid index)
        .get();
      
      // Sort in memory first (no orderBy in query)
      const sortedReports = recentReports.docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 
                     a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : 0;
        const bTime = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 
                     b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : 0;
        return bTime - aTime; // Descending
      });
      
      // Try to match by file path or timestamp
      const fileName = filePath.split('/').pop(); // e.g., "1234567890_before.jpg"
      const timestamp = fileName ? parseInt(fileName.split('_')[0]) : null;
      
      for (const doc of sortedReports) {
        const reportData = doc.data();
        // Check if imageBefore URL contains the file name or if timestamps match
        if (reportData.imageBefore) {
          if (reportData.imageBefore.includes(fileName) || 
              reportData.imageBefore === downloadUrl ||
              reportData.imageBefore.includes(filePath) ||
              (timestamp && reportData.createdAt && 
               Math.abs(reportData.createdAt.toMillis() - timestamp) < 60000)) {
            snap = { docs: [doc], empty: false };
            console.log("✅ Found report by alternative method:", doc.id);
            break;
          }
        }
      }
    }

    if (snap.empty) {
      console.log("⚠️ No report found for image:", downloadUrl);
      console.log("📁 File path:", filePath);
      // Try one more time - get the most recent pending report
      const lastReport = await db
        .collection("reports")
        .where("status", "==", "pending")
        .limit(10) // Get recent reports, sort in memory (no orderBy to avoid index)
        .get();
      
      if (!lastReport.empty) {
        // Sort in memory and use most recent
        const sorted = lastReport.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 
                       a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : 0;
          const bTime = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 
                       b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : 0;
          return bTime - aTime; // Descending
        });
        snap = { docs: [sorted[0]], empty: false };
        console.log("⚠️ Using most recent pending report as fallback");
      } else {
        console.log("❌ No pending reports found. AI analysis skipped.");
        return;
      }
    }

    const reportDoc = snap.docs[0];
    const report = reportDoc.data();

    // Determine if report is valid - EXTREMELY STRICT VALIDATION
    const isValid =
      analysis.imageValid === true &&
      analysis.isRealPhoto === true &&
      analysis.isFake === false &&
      analysis.wasteDetected === "yes" &&
      (analysis.confidence || 0) > 0.6; // Higher confidence threshold (0.6 instead of 0.5)

    // Determine status with STRICT logic - REJECT bad images
    let status = "pending";
    
    // PRIORITY 1: Reject fake images immediately
    if (analysis.isFake === true) {
      status = "fake";
      console.log("❌ REJECTED: Fake/stock image detected");
    } 
    // PRIORITY 2: Reject invalid images
    else if (analysis.imageValid === false || analysis.isRealPhoto === false) {
      status = "invalid";
      console.log("❌ REJECTED: Invalid image (not a real photo)");
    } 
    // PRIORITY 3: Reject if no waste detected
    else if (analysis.wasteDetected === "no" || analysis.wasteDetected !== "yes") {
      status = "no_waste";
      console.log("❌ REJECTED: No waste detected in image");
    } 
    // PRIORITY 4: Accept only if all validations pass
    else if (isValid) {
      status = "assigned";
      console.log("✅ ACCEPTED: Valid waste report");
    } 
    // PRIORITY 5: Keep as pending if uncertain (low confidence)
    else {
      status = "pending";
      console.log("⚠️ UNCERTAIN: Low confidence, keeping as pending");
    }
    
    console.log("📊 Analysis Results:", {
      isValid,
      imageValid: analysis.imageValid,
      isRealPhoto: analysis.isRealPhoto,
      isFake: analysis.isFake,
      wasteDetected: analysis.wasteDetected,
      classification: analysis.classification,
      wasteType: analysis.wasteType,
      severity: analysis.severity,
      confidence: analysis.confidence,
      status,
      description: analysis.description
    });
    
    // Log classification details
    if (analysis.classification) {
      console.log("🏷️ Classification:", analysis.classification.toUpperCase());
    } else {
      console.warn("⚠️ WARNING: No classification returned from AI!");
    }

    // Update report with comprehensive AI analysis
    // Ensure classification is lowercase and valid
    const classification = (analysis.classification || "unknown").toLowerCase().trim();
    const validClassifications = ["dry", "wet", "mixed", "none"];
    const finalClassification = validClassifications.includes(classification) ? classification : "unknown";
    
    // Validate AI response - if classification is missing or invalid, reject
    if (!analysis.classification || finalClassification === "unknown") {
      console.warn("⚠️ WARNING: AI did not provide valid classification!");
      console.warn("   Raw classification:", analysis.classification);
      console.warn("   This may indicate the AI couldn't properly analyze the image.");
    }
    
    console.log("🏷️ Raw classification from AI:", analysis.classification);
    console.log("🏷️ Processed classification:", finalClassification);
    
    // Basic location validation (check if location exists in report)
    const locationValidation = {
      isValid: !!(report.location && report.location.lat && report.location.lng),
      hasAddress: !!(report.location && report.location.address),
      timestamp: report.location?.timestamp || null
    };
    
    const updateData = {
      wasteDetected: analysis.wasteDetected || "no",
      wasteType: analysis.wasteType || "unknown",
      wasteAmount: analysis.wasteAmount || "unknown",
      classification: finalClassification, // DRY/WET/MIXED - ensure lowercase and valid
      level: analysis.severity || "green",
      priority: getPriority(analysis.severity || "green"),
      status: status,
      aiConfidence: analysis.confidence || 0.5,
      aiDescription: analysis.description || "",
      imageValid: analysis.imageValid === true,
      isRealPhoto: analysis.isRealPhoto === true,
      isFake: analysis.isFake === true,
      aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      aiAnalysisDetails: {
        wasteType: analysis.wasteType || "unknown",
        wasteAmount: analysis.wasteAmount || "unknown",
        classification: finalClassification, // DRY/WET/MIXED - ensure it's stored
        severity: analysis.severity || "green",
        confidence: analysis.confidence || 0.5,
        description: analysis.description || "",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      locationValidation: locationValidation, // Store location validation results
      autonomousAnalysis: {
        imageVerified: analysis.imageValid === true && analysis.isRealPhoto === true && analysis.isFake === false,
        wasteDetected: analysis.wasteDetected === "yes",
        classification: finalClassification,
        severity: analysis.severity || "green",
        priority: getPriority(analysis.severity || "green"),
        locationValid: locationValidation.isValid,
        cameraCaptured: report.cameraCaptured || false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      },
      history: admin.firestore.FieldValue.arrayUnion({
        status: status,
        time: admin.firestore.FieldValue.serverTimestamp(),
        aiAnalysis: {
          confidence: analysis.confidence,
          description: analysis.description,
          classification: finalClassification,
          severity: analysis.severity,
          wasteType: analysis.wasteType,
          wasteAmount: analysis.wasteAmount,
        },
      }),
    };
    
    console.log("💾 Storing in Firestore:");
    console.log("   - classification:", finalClassification);
    console.log("   - status:", status);
    console.log("   - wasteDetected:", analysis.wasteDetected);
    console.log("   - isFake:", analysis.isFake);
    
    console.log("📝 Updating report with:", {
      status,
      classification: analysis.classification,
      severity: analysis.severity,
      isFake: analysis.isFake,
      wasteDetected: analysis.wasteDetected
    });

    await reportDoc.ref.update(updateData);

    console.log("✅ Report updated:", reportDoc.id, "Status:", status);

    // POINTS LOGIC
    if (isValid) {
      // Real, valid waste report → +2 points
      try {
        const userRef = db.doc("users/" + report.citizenId);
        const userDoc = await userRef.get();
        if (userDoc.exists()) {
          const currentPoints = userDoc.data().points || 0;
          await userRef.update({ 
            points: admin.firestore.FieldValue.increment(2),
            lastPointsUpdate: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log("✅ Points awarded to citizen:", report.citizenId, "New total:", currentPoints + 2);
        } else {
          console.log("⚠️ User document not found for:", report.citizenId);
          // Create user document if it doesn't exist
          await userRef.set({
            points: 2,
            lastPointsUpdate: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log("✅ Created user document with initial points");
        }
      } catch (pointsError) {
        console.error("❌ Error awarding points:", pointsError);
      }
    } else {
      console.log("⚠️ No points awarded - invalid/fake report");
    }
  } catch (error) {
    console.error("❌ Error in onReportUpload:", error);
    // Update report with error status
    try {
      // Try to find by file path if downloadUrl matching fails (no orderBy to avoid index)
      const snap = await db
        .collection("reports")
        .where("status", "==", "pending")
        .limit(10) // Get recent pending reports (no orderBy)
        .get();
      
      if (!snap.empty) {
        // Sort in memory and use most recent
        const sorted = snap.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 
                       a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : 0;
          const bTime = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 
                       b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : 0;
          return bTime - aTime; // Descending
        });
        
        await sorted[0].ref.update({
          status: "ai_error",
          aiError: error.message,
          aiErrorAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Updated report with error status");
      }
    } catch (updateError) {
      console.error("Error updating report with error status:", updateError);
    }
  }
  }
);

/* When cleaner uploads after-clean image */
exports.onAfterCleanUpload = onObjectFinalized(
  {
    region: "asia-south1",
    // Only process files in reports/ folder that end with _after.jpg
    matchGlob: "reports/**/*_after.jpg"
  },
  async (event) => {
  const object = event.data;
  const filePath = object.name; // e.g., "reports/taskId/timestamp_after.jpg"
  const bucketName = object.bucket;
  
  console.log("🧹 AI Analysis triggered for AFTER image:", filePath);
  
  if (!filePath) {
    console.log("❌ No file path provided");
    return;
  }

  // CRITICAL: Only process files that are explicitly marked as "after" images from sweepers
  if (!filePath.includes("_after.jpg") && !filePath.includes("_after.jpeg")) {
    console.log("⚠️ Skipping file - not an 'after' image:", filePath);
    console.log("   Only files ending with '_after.jpg' are processed as sweeper cleanup");
    return;
  }

  // Get public download URL for Firestore matching (no signing needed)
  const bucket = admin.storage().bucket(bucketName);
  const file = bucket.file(filePath);
  
  // Use public URL format
  const downloadUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
  
  // Make file public temporarily for AI processing
  try {
    await file.makePublic();
    console.log("✅ Made after-clean file public for AI processing");
  } catch (makePublicError) {
    console.log("⚠️ Could not make file public:", makePublicError.message);
  }
  
  const gsUrl = `gs://${bucketName}/${filePath}`;
  console.log("🧹 After-clean analysis triggered for SWEEPER AFTER image:", gsUrl);
  console.log("👤 Source: SWEEPER (after cleaning)");

  try {
    // Find the report document by file path matching (avoid index requirement)
    const fileName = filePath.split('/').pop(); // e.g., "1234567890_after.jpg"
    const taskId = filePath.split('/')[1]; // Could be taskId or userId
    
    console.log("🔍 Searching for report with after image:");
    console.log("   File name:", fileName);
    console.log("   Task/User ID:", taskId);
    
    // Try to find by status (no orderBy to avoid index)
    let snap = await db
      .collection("reports")
      .where("status", "in", ["assigned", "cleaned"])
      .limit(50) // Get recent reports (no orderBy)
      .get();
    
    // Filter in memory to find matching report
    let matchingReport = null;
    snap.docs.forEach(doc => {
      const report = doc.data();
      const reportImageAfter = report.imageAfter || "";
      
      // Match by file name in URL or by taskId
      if (reportImageAfter.includes(fileName) || 
          reportImageAfter.includes(taskId) ||
          doc.id === taskId) {
        matchingReport = { doc, report };
      }
    });
    
    if (matchingReport) {
      snap = { docs: [matchingReport.doc], empty: false };
      console.log("✅ Found report by file matching");
    } else if (snap.empty) {
      console.log("❌ No reports found for comparison");
      return;
    } else {
      // Use most recent report (sort in memory)
      const sortedReports = snap.docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 
                     a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : 0;
        const bTime = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 
                     b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : 0;
        return bTime - aTime; // Descending
      });
      snap = { docs: [sortedReports[0]], empty: false };
      console.log("✅ Using most recent report as fallback");
    }

    const reportDoc = snap.docs[0];
    const report = reportDoc.data();

    if (!report.imageBefore) {
      console.log("⚠️ No before image found for comparison");
      return;
    }

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Enhanced Before/After Comparison
    // CRITICAL: report.imageBefore is from CITIZEN (before), gsUrl is from SWEEPER (after)
    console.log("🔄 Comparing images:");
    console.log("   BEFORE (Citizen):", report.imageBefore);
    console.log("   AFTER (Sweeper):", gsUrl);
    
    const comparison = await compareBeforeAfter(
      report.imageBefore, // CITIZEN image (before cleaning)
      gsUrl,              // SWEEPER image (after cleaning)
      model
    );
    console.log("✅ Before/After comparison complete:", comparison);
    
    // Validate comparison makes sense
    if (comparison.suspicious === true) {
      console.warn("⚠️ SUSPICIOUS COMPARISON DETECTED:", comparison.suspiciousReason);
    }
    
    if (comparison.afterIsCleaner === false) {
      console.warn("⚠️ AFTER image is NOT cleaner than BEFORE - this is suspicious!");
    }

    // Determine if cleaning was successful
    // CRITICAL: Must validate that AFTER is actually cleaner than BEFORE
    const isCleaned =
      comparison.sameLocation &&
      comparison.cleaned &&
      comparison.cleanlinessLevel !== "not clean" &&
      !comparison.remainingWaste &&
      comparison.afterIsCleaner !== false && // AFTER must be cleaner
      comparison.suspicious !== true; // No suspicious activity

    if (isCleaned) {
      const updateData = {
        status: "verified",
        cleaningQuality: comparison.cleaningQuality || "good",
        cleanlinessLevel: comparison.cleanlinessLevel || "mostly clean",
        aiComparisonConfidence: comparison.confidence || 0.5,
        aiComparisonDescription: comparison.description || "",
        afterIsCleaner: comparison.afterIsCleaner !== false,
        suspicious: comparison.suspicious === true,
        suspiciousReason: comparison.suspiciousReason || "",
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        history: admin.firestore.FieldValue.arrayUnion({
          status: "verified",
          time: admin.firestore.FieldValue.serverTimestamp(),
          aiComparison: {
            cleanlinessLevel: comparison.cleanlinessLevel,
            cleaningQuality: comparison.cleaningQuality,
            confidence: comparison.confidence,
            afterIsCleaner: comparison.afterIsCleaner,
            suspicious: comparison.suspicious,
          },
        }),
      };

      await reportDoc.ref.update(updateData);

      console.log("✅ Report verified:", reportDoc.id);

      // POINTS LOGIC
      // Citizen → +2 for verified cleaning
      try {
        const citizenRef = db.doc("users/" + report.citizenId);
        const citizenDoc = await citizenRef.get();
        if (citizenDoc.exists()) {
          await citizenRef.update({ 
            points: admin.firestore.FieldValue.increment(2),
            lastPointsUpdate: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log("✅ Points awarded to citizen:", report.citizenId);
        }
      } catch (error) {
        console.error("❌ Error awarding points to citizen:", error);
      }

      // Sweeper → +2 for successful cleaning
      if (report.assignedSweeper) {
        try {
          const sweeperRef = db.doc("users/" + report.assignedSweeper);
          const sweeperDoc = await sweeperRef.get();
          if (sweeperDoc.exists()) {
            await sweeperRef.update({ 
              points: admin.firestore.FieldValue.increment(2),
              lastPointsUpdate: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Points awarded to sweeper:", report.assignedSweeper);
          }
        } catch (error) {
          console.error("❌ Error awarding points to sweeper:", error);
        }
      }

      console.log("✅ Points awarded to citizen and sweeper");
    } else {
      // Cleaning not verified - update status but don't award points
      await reportDoc.ref.update({
        status: "cleaned",
        cleaningQuality: comparison.cleaningQuality || "poor",
        cleanlinessLevel: comparison.cleanlinessLevel || "not clean",
        aiComparisonConfidence: comparison.confidence || 0.5,
        aiComparisonDescription: comparison.description || "",
        history: admin.firestore.FieldValue.arrayUnion({
          status: "cleaned",
          time: admin.firestore.FieldValue.serverTimestamp(),
          note: "Cleaning not fully verified by AI",
        }),
      });

      console.log("⚠️ Cleaning not fully verified - no points awarded");
    }
  } catch (error) {
    console.error("❌ Error in onAfterCleanUpload:", error);
    // Update report with error status
    try {
      const snap = await db
        .collection("reports")
        .where("status", "in", ["assigned", "cleaned"])
        .limit(10) // Get recent reports (no orderBy to avoid index)
        .get();
      
      if (!snap.empty) {
        // Sort in memory and use most recent
        const sorted = snap.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 
                       a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : 0;
          const bTime = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 
                       b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : 0;
          return bTime - aTime; // Descending
        });
        
        await sorted[0].ref.update({
          status: "cleaned",
          aiComparisonError: error.message,
          aiComparisonErrorAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Updated report with error status");
      }
    } catch (updateError) {
      console.error("Error updating report with error status:", updateError);
    }
  }
  }
);
