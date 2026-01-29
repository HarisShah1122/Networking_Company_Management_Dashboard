class ComplaintStatsService {
  calculateStats(complaints) {
    if (!Array.isArray(complaints)) {
      return {
        total: 0,
        internal: 0,
        external: 0,
        open: 0,
        in_progress: 0,
        on_hold: 0,
        closed: 0,
        by_source: {},
        by_district: {},
        by_priority: {
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      };
    }

    const stats = {
      total: complaints.length,
      internal: 0,
      external: 0,
      open: 0,
      in_progress: 0,
      on_hold: 0,
      closed: 0,
      by_source: {},
      by_district: {},
      by_priority: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    // Use reduce for efficient aggregation
    complaints.reduce((acc, complaint) => {
      // Count by source
      const source = complaint.sourceLabel || complaint.source || 'Unknown';
      acc.by_source[source] = (acc.by_source[source] || 0) + 1;

      // Count by district
      const district = complaint.district || 'Unknown';
      acc.by_district[district] = (acc.by_district[district] || 0) + 1;

      // Count by status
      const status = complaint.status;
      if (status === 'open') acc.open++;
      else if (status === 'in_progress') acc.in_progress++;
      else if (status === 'on_hold') acc.on_hold++;
      else if (status === 'closed') acc.closed++;

      // Count by source type
      if (complaint.source === 'internal') acc.internal++;
      else if (complaint.source === 'external') acc.external++;

      // Count by priority
      const priority = complaint.priority;
      if (priority === 'urgent') acc.by_priority.urgent++;
      else if (priority === 'high') acc.by_priority.high++;
      else if (priority === 'medium') acc.by_priority.medium++;
      else if (priority === 'low') acc.by_priority.low++;

      return acc;
    }, stats);

    return stats;
  }

  calculateTrends(complaints, period = 'monthly') {
    if (!Array.isArray(complaints) || complaints.length === 0) {
      return [];
    }

    const now = new Date();
    const trends = {};

    complaints.forEach(complaint => {
      const createdAt = new Date(complaint.createdAt || complaint.created_at);
      let key;

      if (period === 'daily') {
        key = createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(createdAt);
        weekStart.setDate(createdAt.getDate() - createdAt.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // monthly
        key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = {
          period: key,
          total: 0,
          open: 0,
          closed: 0,
          urgent: 0,
          high: 0,
          medium: 0,
          low: 0
        };
      }

      trends[key].total++;

      const status = complaint.status;
      if (status === 'open') trends[key].open++;
      else if (status === 'closed') trends[key].closed++;

      const priority = complaint.priority;
      if (priority === 'urgent') trends[key].urgent++;
      else if (priority === 'high') trends[key].high++;
      else if (priority === 'medium') trends[key].medium++;
      else if (priority === 'low') trends[key].low++;
    });

    return Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));
  }

  calculateResolutionTime(complaints) {
    if (!Array.isArray(complaints)) {
      return {
        averageResolutionTime: 0,
        medianResolutionTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        totalResolved: 0
      };
    }

    const resolvedComplaints = complaints.filter(c => 
      c.status === 'closed' && 
      c.createdAt && 
      c.resolvedAt
    );

    if (resolvedComplaints.length === 0) {
      return {
        averageResolutionTime: 0,
        medianResolutionTime: 0,
        fastestResolution: 0,
        slowestResolution: 0,
        totalResolved: 0
      };
    }

    const resolutionTimes = resolvedComplaints.map(complaint => {
      const created = new Date(complaint.createdAt || complaint.created_at);
      const resolved = new Date(complaint.resolvedAt);
      return (resolved - created) / (1000 * 60 * 60); // hours
    }).sort((a, b) => a - b);

    const total = resolutionTimes.reduce((sum, time) => sum + time, 0);
    const average = total / resolutionTimes.length;
    const median = resolutionTimes[Math.floor(resolutionTimes.length / 2)];

    return {
      averageResolutionTime: Math.round(average * 100) / 100,
      medianResolutionTime: Math.round(median * 100) / 100,
      fastestResolution: Math.round(resolutionTimes[0] * 100) / 100,
      slowestResolution: Math.round(resolutionTimes[resolutionTimes.length - 1] * 100) / 100,
      totalResolved: resolvedComplaints.length
    };
  }
}

module.exports = new ComplaintStatsService();
