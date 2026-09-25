import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  LocaleProvider,
  useLocale,
} from "@/components/providers/locale-provider";

function CurrentLocale() {
  const { dictionary, locale } = useLocale();
  return (
    <span>
      {locale}:{dictionary.navigation.home}
    </span>
  );
}

describe("LocaleProvider", () => {
  it("keeps the interface Thai-only and removes a stale language preference", async () => {
    window.localStorage.setItem("jmwl-locale", "en");
    document.documentElement.lang = "en";

    render(
      <LocaleProvider>
        <CurrentLocale />
      </LocaleProvider>,
    );

    expect(screen.getByText("th:ภาพรวม")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("jmwl-locale")).toBeNull();
      expect(document.documentElement.lang).toBe("th");
    });
  });
});
