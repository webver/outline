import { EmailIcon } from "outline-icons";
import * as React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import AuthLogo from "~/components/AuthLogo";
import ButtonLarge from "~/components/ButtonLarge";
import InputLarge from "~/components/InputLarge";
import { client } from "~/utils/ApiClient";

type Props = WithTranslation & {
  id: string;
  name: string;
  authUrl: string;
  isCreate: boolean;
  onEmailSuccess: (email: string) => void;
};

type State = {
  showEmailSignin: boolean;
  showLdapSignin: boolean;
  isSubmitting: boolean;
  email: string;
  password: string;
};

class Provider extends React.Component<Props, State> {
  state = {
    showEmailSignin: false,
    showLdapSignin: false,
    isSubmitting: false,
    email: "",
    password: "",
  };

  handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      email: event.target.value,
    });
  };

  handleChangePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      password: event.target.value,
    });
  };

  handleSubmitEmail = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.showEmailSignin && this.state.email) {
      this.setState({
        isSubmitting: true,
      });

      try {
        const response = await client.post(event.currentTarget.action, {
          email: this.state.email,
        });

        if (response.redirect) {
          window.location.href = response.redirect;
        } else {
          this.props.onEmailSuccess(this.state.email);
        }
      } finally {
        this.setState({
          isSubmitting: false,
        });
      }
    } else {
      this.setState({
        showEmailSignin: true,
      });
    }
  };

  handleSubmitActiveDirectory = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (this.state.showLdapSignin && this.state.email && this.state.password) {
      this.setState({
        isSubmitting: true,
      });

      try {
        const response = await fetch(event.currentTarget.action, {
          method: 'POST',
          cache: 'no-cache',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/json'
          },
          referrerPolicy: 'no-referrer',
          body: JSON.stringify({
            email: this.state.email,
            password: this.state.password,
          })
        });

        if (response.redirected) {
          console.log("redirect")
          window.location.href = response.url;
        }

      } finally {
        this.setState({
          isSubmitting: false,
        });
      }
    } else {
      this.setState({
        showLdapSignin: true,
      });
    }
  };

  render() {
    const { isCreate, id, name, authUrl, t } = this.props;

    if (id === "email") {
      if (isCreate) {
        return null;
      }

      return (
        <Wrapper key="email">
          <Form
            method="POST"
            action="/auth/email"
            onSubmit={this.handleSubmitEmail}
          >
            {this.state.showEmailSignin ? (
              <>
                <InputLarge
                  type="email"
                  name="email"
                  placeholder="me@domain.com"
                  value={this.state.email}
                  onChange={this.handleChangeEmail}
                  disabled={this.state.isSubmitting}
                  autoFocus
                  required
                  short
                />
                <ButtonLarge type="submit" disabled={this.state.isSubmitting}>
                  {t("Sign In")} →
                </ButtonLarge>
              </>
            ) : (
              <ButtonLarge type="submit" icon={<EmailIcon />} fullwidth>
                {t("Continue with Email")}
              </ButtonLarge>
            )}
          </Form>
        </Wrapper>
      );
    }

    if (id === "active_directory") {
      if (isCreate) {
        return null;
      }

      return (
        <Wrapper key="active_directory">
          <Form
            method="POST"
            action="/auth/active_directory"
            onSubmit={this.handleSubmitActiveDirectory}
          >
            {this.state.showLdapSignin ? (
              <>
                <InputLarge
                  type="email"
                  name="email"
                  placeholder="me@mgtniip.ru"
                  value={this.state.email}
                  onChange={this.handleChangeEmail}
                  disabled={this.state.isSubmitting}
                  autoFocus
                  required
                  short
                />
                <InputLarge
                  type="password"
                  name="password"
                  placeholder="password"
                  value={this.state.password}
                  onChange={this.handleChangePassword}
                  disabled={this.state.isSubmitting}
                  required
                  short
                />
                <ButtonLarge type="submit" disabled={this.state.isSubmitting}>
                  {t("Sign In")} →
                </ButtonLarge>
              </>
            ) : (
              <ButtonLarge type="submit" icon={<EmailIcon />} fullwidth>
                {t("Continue with ActiveDirectory ")}
              </ButtonLarge>
            )}
          </Form>
        </Wrapper>
      );
    }

    return (
      <Wrapper key={id}>
        <ButtonLarge
          onClick={() => (window.location.href = authUrl)}
          icon={<AuthLogo providerName={id} />}
          fullwidth
        >
          {t("Continue with {{ authProviderName }}", {
            authProviderName: name,
          })}
        </ButtonLarge>
      </Wrapper>
    );
  }
}

const Wrapper = styled.div`
  margin-bottom: 1em;
  width: 100%;
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

export default withTranslation()(Provider);
