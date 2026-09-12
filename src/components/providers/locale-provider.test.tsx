import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LanguageToggle } from "@/components/language-toggle";
import {
  LocaleProvider,
  useLocale,
} from "@/components/providers/locale-provider";

function CurrentHomeLabel() {
  const { dictionary } = useLocale();
  return <span>{dictionary.navigation.home}</span>;
}

describe("LocaleProvider", () => {
  it("switches between Thai and English and persists the preference locally", async () => {
    const user = userEvent.setup();
    document.documentElement.lang = "th";
    render(
      <LocaleProvider>
        <LanguageToggle />
        <CurrentHomeLabel />
      </LocaleProvider>,
    );

    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เปลี่ยนภาษา EN" }));

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(window.localStorage.getItem("jmwl-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("th");
  });
});
