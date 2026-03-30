import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60000,
    expect: {
        timeout: 10000,
    },
    retries: 0,
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:4173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    webServer: {
        command: "npm run dev -- --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: false,
        timeout: 120000,
        env: {
            VITE_API_URL_LDAP: "/LDAPservice",
            VITE_API_URL_OFICIAL_SCHEDULE: "/api/oficial/",
            VITE_API_URL_PERSONAL_SCHEDULE: "/api/personal/",
            VITE_API_URL_COURSE_TYPES: "/api/categories",
            VITE_API_URL_REMINDERS_TAGS_USER: "/api/reminders",
            VITE_API_URL_NOTIFICATIONS: "/api/notifications/",
            VITE_API_GET_USER_DATA: "/api/get-user/",
            VITE_API_CHANGE_PASSWORD: "/api/auth/changepassword",
            VITE_API_URL_TAGS_USER: "/api/tags-by-user/",
        },
    },
    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" },
        },
    ],
});
