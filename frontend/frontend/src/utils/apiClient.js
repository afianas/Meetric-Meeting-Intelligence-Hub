/**
 * API Client Layer
 * Centralizes all network requests to the backend, enabling easy tracking,
 * error handling, and separation of concerns from React components.
 */

// Base URL points to the Vite proxy configured in vite.config.js
const BASE_URL = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  
  if (!response.ok) {
        let errorMsg = `HTTP Error: ${response.status}`;
        try {
            const data = await response.json();
            errorMsg = data.detail || errorMsg;
        } catch (e) {
            errorMsg = await response.text() || errorMsg;
        }
        throw new Error(errorMsg);
  }
  
  return response.json();
}

export const apiClient = {
  /**
   * Fetches all meetings.
   * Route: GET /meetings
   */
  async getMeetings() {
    return fetchJSON('/meetings');
  },

  /**
   * Fetches details of a single meeting.
   * Route: GET /meetings/{id}
   */
  async getMeeting(id) {
    return fetchJSON(`/meetings/${id}`);
  },

  /**
   * Uploads a transcript file to the backend with an optional meeting name.
   * Route: POST /upload
   */
  async uploadTranscript(file, meetingName = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (meetingName && meetingName.trim()) {
      formData.append('meeting_name', meetingName.trim());
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        let errorMsg = `Upload failed: ${response.status}`;
        try {
            const data = await response.json();
            errorMsg = data.detail || errorMsg;
        } catch(e) { /* ignore */ }
        throw new Error(errorMsg);
    }
    
    return response.json();
  },

  /**
   * Deletes ALL meetings from the database.
   * Route: DELETE /meetings/all
   */
  async clearAllMeetings() {
    return fetchJSON('/meetings/all', { method: 'DELETE' });
  },

  /**
   * Deletes a single meeting by ID.
   * Route: DELETE /meetings/{id}
   */
  async deleteMeeting(id) {
    return fetchJSON(`/meetings/${id}`, { method: 'DELETE' });
  },

  /**
   * Updates an action item/task status.
   * Route: POST /update-task
   * Backend expects: { meeting_id: str, task_id: int, status: str }
   */
  async updateTaskStatus(meetingId, taskId, completed) {
    return fetchJSON('/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            meeting_id: meetingId,
            task_id: taskId,
            status: completed ? 'completed' : 'pending'
        })
    });
  },

  /**
   * Queries the global RAG chatbot.
   * Route: GET /chat
   */
  async queryChat(query, meetingId = null) {
      const params = new URLSearchParams({ query });
      if (meetingId) params.append('meeting_id', meetingId);
      return fetchJSON(`/chat?${params}`);
  },

  /**
   * Semantic search query.
   * Route: GET /semantic-search
   */
  async querySearch(query) {
      const params = new URLSearchParams({ query });
      return fetchJSON(`/semantic-search?${params}`);
  },

  /**
   * Downloads a meeting report as PDF/CSV.
   * Route: POST /download?format=xyz
   */
  async downloadMeetingReport(meetingData, format = 'pdf') {
      const response = await fetch(`${BASE_URL}/download?format=${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(meetingData)
      });
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
  }
};
