declare const process: {
    env:{
        readonly EXPO_PUBLIC_SUPABASE_URL: string;
        readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
        readonly EXPO_PUBLIC_GEMINI_API_KEY: string;
        readonly EXPO_PUBLIC_WEB_AUTH_URL: string;
        readonly [key: string]: string | undefined;
    };
};