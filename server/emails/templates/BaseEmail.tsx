import mailer from "@server/emails/mailer";
import Metrics from "@server/logging/metrics";
import { taskQueue } from "@server/queues";
import { TaskPriority } from "@server/queues/tasks/BaseTask";

interface EmailProps {
  to: string;
}

export default abstract class BaseEmail<T extends EmailProps, S = any> {
  private props: T;

  /**
   * Schedule this email type to be sent asyncronously by a worker.
   *
   * @param props Properties to be used in the email template
   * @returns A promise that resolves once the email is placed on the task queue
   */
  public static schedule<T>(props: T) {
    const templateName = this.name;

    Metrics.increment("email.scheduled", {
      templateName,
    });

    // Ideally we'd use EmailTask.schedule here but importing creates a circular
    // dependency so we're pushing onto the task queue in the expected format
    return taskQueue.add(
      {
        name: "EmailTask",
        props: {
          templateName,
          props,
        },
      },
      {
        priority: TaskPriority.Normal,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 60 * 1000,
        },
      }
    );
  }

  constructor(props: T) {
    this.props = props;
  }

  /**
   * Send this email now.
   *
   * @returns A promise that resolves once the email has been successfully sent.
   */
  public async send() {
    const bsResponse = this.beforeSend
      ? await this.beforeSend(this.props)
      : ({} as S);
    const data = { ...this.props, ...bsResponse };
    const templateName = this.constructor.name;

    try {
      await mailer.sendMail({
        to: this.props.to,
        subject: this.subject(data),
        previewText: this.preview(data),
        component: this.render(data),
        text: this.renderAsText(data),
      });
      Metrics.increment("email.sent", {
        templateName,
      });
    } catch (err) {
      Metrics.increment("email.sending_failed", {
        templateName,
      });
      throw err;
    }
  }

  /**
   * Returns the subject of the email.
   *
   * @param props Props in email constructor
   * @returns The email subject as a string
   */
  protected abstract subject(props: S & T): string;

  /**
   * Returns the preview text of the email, this is the text that will be shown
   * in email client list views.
   *
   * @param props Props in email constructor
   * @returns The preview text as a string
   */
  protected abstract preview(props: S & T): string;

  /**
   * Returns a plain-text version of the email, this is the text that will be
   * shown if the email client does not support or want HTML.
   *
   * @param props Props in email constructor
   * @returns The plain text email as a string
   */
  protected abstract renderAsText(props: S & T): string;

  /**
   * Returns a React element that will be rendered on the server to produce the
   * HTML version of the email.
   *
   * @param props Props in email constructor
   * @returns A JSX element
   */
  protected abstract render(props: S & T): JSX.Element;

  /**
   * beforeSend hook allows async loading additional data that was not passed
   * through the serialized worker props.
   *
   * @param props Props in email constructor
   * @returns A promise resolving to additional data
   */
  protected beforeSend?(props: T): Promise<S>;
}
