import passport from "@outlinewiki/koa-passport";
import Router from "koa-router";
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'pass... Remove this comment to see the full error message
import { Strategy as LdapStrategy } from "passport-ldapauth";
import accountProvisioner from "@server/commands/accountProvisioner";
import { LdapError } from "@server/errors";
import passportMiddleware from "@server/middlewares/passport";
import { isDomainAllowed } from "@server/utils/authentication";
import { StateStore } from "@server/utils/passport";

const router = new Router();
const providerName = "active_directory";
const ACTIVE_DIRECTORY_URL = process.env.ACTIVE_DIRECTORY_URL;
const ACTIVE_DIRECTORY_BIND_DN = process.env.ACTIVE_DIRECTORY_BIND_DN;
const ACTIVE_DIRECTORY_BIND_CREDENTIALS =
  process.env.ACTIVE_DIRECTORY_BIND_CREDENTIALS;
const ACTIVE_DIRECTORY_SEARCH_BASE = process.env.ACTIVE_DIRECTORY_SEARCH_BASE;
const ACTIVE_DIRECTORY_SEARCH_FILTER =
  process.env.ACTIVE_DIRECTORY_SEARCH_FILTER;
const ACTIVE_DIRECTORY_SEARCH_ATTRIBUTES =
  process.env.ACTIVE_DIRECTORY_SEARCH_ATTRIBUTES;
// @ts-expect-error ts-migrate(7034) FIXME: Variable 'scopes' implicitly has type 'any[]' in s... Remove this comment to see the full error message
const scopes = [];

export const config = {
  name: "ActiveDirectory",
  enabled: !!ACTIVE_DIRECTORY_URL,
};

if (ACTIVE_DIRECTORY_URL) {
  passport.use(
    new LdapStrategy(
      {
        server: {
          url: ACTIVE_DIRECTORY_URL,
          bindDN: ACTIVE_DIRECTORY_BIND_DN,
          bindCredentials: ACTIVE_DIRECTORY_BIND_CREDENTIALS,
          searchBase: ACTIVE_DIRECTORY_SEARCH_BASE,
          searchFilter: ACTIVE_DIRECTORY_SEARCH_FILTER,
          searchAttributes: ACTIVE_DIRECTORY_SEARCH_ATTRIBUTES,
          //tlsOptions: {},
          //includeRaw: true,
        },
        usernameField: "email",
        passwordField: "password",
        // callbackURL: `${env.URL}/auth/active_directory.callback`,
        passReqToCallback: true,
        store: new StateStore(),
        // @ts-expect-error ts-migrate(7005) FIXME: Variable 'scopes' implicitly has an 'any[]' type.
        scope: scopes,
      },
      // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'req' implicitly has an 'any' type.
      async function (req, profile, done) {
        try {
          if (!profile) {
            throw LdapError("Unable to load user profile from LDAP");
          }

          if (!profile.mail) {
            throw LdapError("Unable to load user profile from LDAP");
          }

          const domain = profile.mail.split("@")[1];
          const subdomain = domain.split(".")[0];
          const teamName = profile.department;

          if (!domain) {
            throw LdapError();
          }

          if (!isDomainAllowed(domain)) {
            throw LdapError();
          }

          const result = await accountProvisioner({
            ip: req.ip,
            team: {
              name: teamName,
              domain,
              subdomain,
            },
            user: {
              name: profile.displayName,
              email: profile.mail.toLowerCase(),
            },
            authenticationProvider: {
              name: providerName,
              providerId: domain,
            },
            authentication: {
              providerId: profile.mail.toLowerCase(),
              // @ts-expect-error ts-migrate(7005) FIXME: Variable 'scopes' implicitly has an 'any[]' type.
              scopes: scopes,
            },
          });

          return done(null, result.user, result);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // router.post("active_directory.test", passport.authenticate('ldapauth', { session: false }));
  router.post("active_directory", passportMiddleware("ldapauth"));
}

// //@ts-expect-error ts-migrate(7006) FIXME: Parameter 'req' implicitly has an 'any' type.
// function getTlsOptions(conf) {
//   if (!conf.tlsEnabled) {
//     return {};
//   }
//
//   // if (!conf.tlsCertPath) {
//   //   return {
//   //     rejectUnauthorized: conf.verifyTLSCertificate,
//   //   }
//   // }
//
//   // const caList = []
//   // if (conf.verifyTLSCertificate) {
//   //   caList.push(fs.readFileSync(conf.tlsCertPath))
//   // }
//
//   // return {
//   //   rejectUnauthorized: conf.verifyTLSCertificate,
//   //   ca: caList
//   // }
// }

export default router;
