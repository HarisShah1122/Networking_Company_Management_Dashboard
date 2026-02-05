// Test script for area-based assignment
// This can be run in the backend to test the assignment functionality

const areaAssignmentService = require('./src/services/areaAssignmentService');
const { Complaint, User, Area } = require('./src/models');

async function testAreaAssignment() {
  try {
    console.log('🧪 Testing Area-Based Assignment System...\n');

    // Test 1: Get area assignment stats
    console.log('📊 Getting area assignment stats...');
    const stats = await areaAssignmentService.getAreaAssignmentStats('your-company-id-here');
    console.log('Area stats:', JSON.stringify(stats, null, 2));

    // Test 2: Find nearest area with technicians for a complaint
    console.log('\n🔍 Finding nearest area with technicians...');
    const testComplaintId = 'your-test-complaint-id-here';
    
    // First get the complaint location
    const complaint = await Complaint.findByPk(testComplaintId);
    if (complaint) {
      const location = await areaAssignmentService.getComplaintLocation(complaint);
      console.log('Complaint location:', location);
      
      const nearestArea = await areaAssignmentService.findNearestAreaWithTechnicians(location);
      console.log('Nearest area with technicians:', nearestArea);
    }

    // Test 3: Assign complaint to nearest technician
    console.log('\n👨‍🔧 Assigning complaint to nearest technician...');
    const assignmentResult = await areaAssignmentService.assignComplaintToNearestTechnician(testComplaintId);
    console.log('Assignment result:', JSON.stringify(assignmentResult, null, 2));

    console.log('\n✅ Area-based assignment test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in routes or direct testing
module.exports = { testAreaAssignment };

// Uncomment to run directly
// testAreaAssignment();
