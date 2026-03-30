import { apiClient } from "./apiClient";

/**
 * Modern Export Utilities
 * Bridges UI data to the specialized Backend Download Service
 */

/**
 * Exports a full meeting report (PDF or CSV)
 * @param {Object} meeting - The Mapped UI Meeting Model
 * @param {string} format - 'pdf' | 'csv'
 */
export async function exportMeetingReport(meeting, format = 'pdf') {
  if (!meeting) return;

  try {
    // We send the 'rawMeeting' structure or a shaped analysis to the backend
    // Backend download.py expects: { analysis: { decisions, action_items } }
    const payload = {
      analysis: {
        meeting_name: meeting.name,
        date: meeting.date,
        overall_sentiment: meeting.sentiment,
        summary: meeting.summary,
        decisions: meeting.decisions.map(d => d.title),
        action_items: meeting.actions.map(a => ({
          who: a.who,
          task: a.content,
          deadline: a.deadline
        }))
      }
    };

    await apiClient.downloadMeetingReport(payload, format);
  } catch (err) {
    console.error("Export failed", err);
    alert("Export failed. Please check the backend connection.");
  }
}

/**
 * Legacy support for simple CSV exports (migrated to backend service)
 */
export async function exportActionsCSV(actions) {
  const payload = {
    analysis: {
      action_items: actions.map(a => ({
        who: a.who,
        task: a.content,
        deadline: a.deadline
      }))
    }
  };
  await apiClient.downloadMeetingReport(payload, 'csv');
}

export async function exportDecisionsCSV(decisions) {
  const payload = {
      analysis: {
          decisions: decisions.map(d => d.title)
      }
  };
  await apiClient.downloadMeetingReport(payload, 'csv');
}
