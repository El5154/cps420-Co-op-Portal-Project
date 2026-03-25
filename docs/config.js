const isLocal =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const BASE_URL = isLocal
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : "https://co-op-portal-cps406.onrender.com";