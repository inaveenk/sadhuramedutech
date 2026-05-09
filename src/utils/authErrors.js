export function authErrorToKey(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "auth_invalid_email";
    case "auth/user-not-found":
      return "auth_no_account";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "auth_wrong_password";
    case "auth/too-many-requests":
      return "auth_too_many_requests";
    case "auth/email-already-in-use":
      return "auth_email_in_use";
    case "auth/weak-password":
      return "auth_weak_password";
    default:
      return "auth_generic";
  }
}

