import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { VIEW_STATE, type ViewState } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils/testI18n";
import { ViewStateSwitch } from "../ViewStateSwitch";
import { createViewStateSwitchPage } from "./ViewStateSwitch.page";

const EMPTY_MESSAGE = "Nothing here yet";
const CONTENT_TEXT = "Loaded content";

const renderViewStateSwitch = (viewState: ViewState): void => {
  render(
    <I18nextProvider i18n={testI18n}>
      <ViewStateSwitch emptyMessage={EMPTY_MESSAGE} viewState={viewState}>
        <p>{CONTENT_TEXT}</p>
      </ViewStateSwitch>
    </I18nextProvider>,
  );
};

describe("ViewStateSwitch", () => {
  it("shows the loading status while loading", () => {
    renderViewStateSwitch(VIEW_STATE.LOADING);
    const viewStateSwitchPage = createViewStateSwitchPage();

    expect(viewStateSwitchPage.queryLoadingStatus()).toBeInTheDocument();
    expect(viewStateSwitchPage.queryText(CONTENT_TEXT)).not.toBeInTheDocument();
  });

  it("shows the translated generic error on error", () => {
    renderViewStateSwitch(VIEW_STATE.ERROR);
    const viewStateSwitchPage = createViewStateSwitchPage();

    expect(viewStateSwitchPage.queryErrorAlert()).toHaveTextContent(
      testI18n.t("errors.unknown"),
    );
  });

  it("shows the empty message when there is nothing to show", () => {
    renderViewStateSwitch(VIEW_STATE.EMPTY);
    const viewStateSwitchPage = createViewStateSwitchPage();

    expect(viewStateSwitchPage.queryText(EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it("shows the content when ready", () => {
    renderViewStateSwitch(VIEW_STATE.READY);
    const viewStateSwitchPage = createViewStateSwitchPage();

    expect(viewStateSwitchPage.queryText(CONTENT_TEXT)).toBeInTheDocument();
  });
});
