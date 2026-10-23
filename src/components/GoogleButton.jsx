import { useEffect, useRef, useState } from "react";

// Google Identity Services: renders Google's own "Sign in with Google" button
// and hands back an ID token (`credential`) for the API to verify.
const SCRIPT_URL = "https://accounts.google.com/gsi/client";
let loading = null;

function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("offline"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export default function GoogleButton({ clientId, onCredential }) {
  const ref = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    setFailed(false);
    loadGoogle()
      .then((google) => {
        if (cancelled || !ref.current) return;
        google.accounts.id.initialize({ client_id: clientId, callback: (res) => onCredentialRef.current(res.credential) });
        google.accounts.id.renderButton(ref.current, { theme: "outline", size: "large", shape: "pill", text: "signin_with" });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!clientId) return <p className="notice">Sign-in isn't available right now. Check your connection and try again.</p>;
  if (failed) return <p className="notice">Couldn't load Google sign-in. Check your connection and try again.</p>;
  return <div ref={ref} className="google-button" />;
}
