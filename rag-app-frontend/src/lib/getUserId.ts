import { v4 as uuidv4 } from "uuid";

export function getSessionId() {
  if (typeof window === "undefined") {
    return "nobody";
  }

  // Check if the session ID is already stored in the session storage.
  let sessionId = sessionStorage.getItem("sessionId");

  // If not, generate a new one and store it.
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem("sessionId", sessionId);
  }

  return sessionId;
}
