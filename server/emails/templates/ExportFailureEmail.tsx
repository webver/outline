import * as React from "react";
import BaseEmail from "./BaseEmail";
import Body from "./components/Body";
import Button from "./components/Button";
import EmailTemplate from "./components/EmailLayout";
import EmptySpace from "./components/EmptySpace";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Heading from "./components/Heading";

type Props = {
  to: string;
  teamUrl: string;
};

/**
 * Email sent to a user when their data export has failed for some reason.
 */
export default class ExportFailureEmail extends BaseEmail<Props> {
  protected subject() {
    return "Your requested export";
  }

  protected preview() {
    return "Sorry, your requested data export has failed";
  }

  protected renderAsText() {
    return `
Your Data Export

Sorry, your requested data export has failed, please visit the admin
section to try again – if the problem persists please contact support.
`;
  }

  protected render({ teamUrl }: Props) {
    return (
      <EmailTemplate>
        <Header />
        <Body>
          <Heading>Your Data Export</Heading>
          <p>
            Sorry, your requested data export has failed, please visit the{" "}
            <a
              href={`${teamUrl}/settings/export`}
              rel="noreferrer"
              target="_blank"
            >
              admin section
            </a>
            . to try again – if the problem persists please contact support.
          </p>
          <EmptySpace height={10} />
          <p>
            <Button href={`${teamUrl}/settings/export`}>Go to export</Button>
          </p>
        </Body>
        <Footer />
      </EmailTemplate>
    );
  }
}
