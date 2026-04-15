export const getToken = () => localStorage.getItem("surelyai_token");
export const setToken = (t: string) => localStorage.setItem("surelyai_token", t);
export const clearToken = () => localStorage.removeItem("surelyai_token");

export const getUserRole = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // In our backend, the subject is the worker ID, but we might want to store role in JWT later.
        // For now, we'll assume the dashboard knows the role from the /me response,
        // but for route guards, we can check a separate role key or decode it if present.
        return localStorage.getItem("surelyai_role"); 
    } catch (e) {
        return null;
    }
};

export const setRole = (role: string) => localStorage.setItem("surelyai_role", role);
