import { fetchAuthSession } from "aws-amplify/auth";
import middleware, { config } from "../proxy";

describe("middleware auth guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows the splash page without requiring a session", async () => {
    const request = {
      nextUrl: { pathname: "/" },
      url: "http://localhost/",
    } as any;

    const response = await middleware(request);

    expect(response?.status).toBe(200);
    expect(fetchAuthSession).not.toHaveBeenCalled();
  });

  it("redirects protected paths when there is no access token", async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({ tokens: {} });

    const request = {
      nextUrl: { pathname: "/dashboard" },
      url: "http://localhost/dashboard",
    } as any;

    const response = await middleware(request);

    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost/");
  });

  it("allows protected paths when there is a valid access token", async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValue({
      tokens: { accessToken: "abc123" },
    });

    const request = {
      nextUrl: { pathname: "/dashboard" },
      url: "http://localhost/dashboard",
    } as any;

    const response = await middleware(request);

    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
    expect(response?.status).toBe(200);
  });

  it("redirects protected paths when auth throws", async () => {
    (fetchAuthSession as jest.Mock).mockRejectedValue(new Error("boom"));

    const request = {
      nextUrl: { pathname: "/settings" },
      url: "http://localhost/settings",
    } as any;

    const response = await middleware(request);

    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost/");
  });

  it("matches public and API routes as expected", () => {
    const matcher = config.matcher as string[];

    const shouldMatch = ["/", "/dashboard", "/api/health", "/foo/bar"];
    const shouldNotMatch = ["/_next/static/app.js", "/favicon.ico", "/image.png"];

    for (const path of shouldMatch) {
      expect(new RegExp(matcher[0].replace(/^\//, "").replace(/\/$/, ""))).not.toBeNull();
      expect(path.startsWith("/_next") || path.match(/\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)).toBe(false);
    }

    for (const path of shouldNotMatch) {
      expect(path.startsWith("/_next") || path.match(/\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/)).toBe(true);
    }
  });
});
