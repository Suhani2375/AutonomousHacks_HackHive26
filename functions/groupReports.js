/**
 * Location Intelligence Agent - Groups nearby reports
 * This function groups reports from the same area into one cleanup task
 */

const admin = require("firebase-admin");

/**
 * Group reports by location (within 100 meters)
 * Returns grouped reports for efficient task assignment
 */
async function groupReportsByLocation() {
  const db = admin.firestore();
  
  try {
    // Get all assigned/pending reports
    const reportsSnapshot = await db
      .collection("reports")
      .where("status", "in", ["assigned", "pending"])
      .get();
    
    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const groups = [];
    const processed = new Set();
    
    // Group reports within 100 meters of each other
    for (let i = 0; i < reports.length; i++) {
      if (processed.has(reports[i].id)) continue;
      
      const group = [reports[i]];
      processed.add(reports[i].id);
      
      for (let j = i + 1; j < reports.length; j++) {
        if (processed.has(reports[j].id)) continue;
        
        const distance = calculateDistance(
          reports[i].location?.lat || 0,
          reports[i].location?.lng || 0,
          reports[j].location?.lat || 0,
          reports[j].location?.lng || 0
        );
        
        // If within 100 meters, add to same group
        if (distance <= 0.1) { // 100 meters = 0.1 km
          group.push(reports[j]);
          processed.add(reports[j].id);
        }
      }
      
      if (group.length > 1) {
        groups.push({
          reports: group,
          centerLocation: calculateCenter(group.map(r => r.location)),
          totalReports: group.length,
          highestPriority: Math.min(...group.map(r => r.priority || 3))
        });
      }
    }
    
    return groups;
  } catch (error) {
    console.error("Error grouping reports:", error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

/**
 * Calculate center point of multiple locations
 */
function calculateCenter(locations) {
  const validLocations = locations.filter(loc => loc && loc.lat && loc.lng);
  if (validLocations.length === 0) return null;
  
  const avgLat = validLocations.reduce((sum, loc) => sum + loc.lat, 0) / validLocations.length;
  const avgLng = validLocations.reduce((sum, loc) => sum + loc.lng, 0) / validLocations.length;
  
  return { lat: avgLat, lng: avgLng };
}

module.exports = { groupReportsByLocation, calculateDistance, calculateCenter };

