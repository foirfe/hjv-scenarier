const API_URL = "http://localhost:3000";

export async function apiFetch<T> (
path: string,
options: RequestInit = {},    
): Promise<T> {
    const token = sessionStorage.getItem("accessToken");
    const headers = new Headers(options.headers);
    if(token){
        headers.set("Authorization", `Bearer ${token}`)
    }
if (options.body && !headers.has("Content-Type")){
    headers.set("Content-Type", "application/json");
}

const response = await fetch(`${API_URL}${path}`,{
    ...options,
    headers,
});

if (response.status === 401){
    sessionStorage.removeItem("accessToken");
    window.location.href = "/login";

    throw new Error("Din session er udløbet");
}
if (!response.ok){
    throw new Error (`API-fejl: ${response.status}`)
}
return response.json() as Promise<T>;
}
