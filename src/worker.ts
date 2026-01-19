export interface Env {
    ENVIRONMENT: string;
    API_URL: string;
    FIREBASE_PROJECT_ID: string;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Un simple point de terminaison de santé/info
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({
                status: "ok",
                environment: env.ENVIRONMENT,
                timestamp: new Date().toISOString()
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(`Welcome to Hodour API (${env.ENVIRONMENT})! Try /health for status.`);
    },
};
