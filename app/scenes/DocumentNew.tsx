import { observer } from "mobx-react";
import queryString from "query-string";
import * as React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useRouteMatch } from "react-router-dom";
import CenteredContent from "~/components/CenteredContent";
import Flex from "~/components/Flex";
import PlaceholderDocument from "~/components/PlaceholderDocument";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import { editDocumentUrl } from "~/utils/routeHelpers";

function DocumentNew() {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch<{ id?: string }>();
  const { t } = useTranslation();
  const { documents, collections } = useStores();
  const { showToast } = useToasts();
  const id = match.params.id || "";

  useEffect(() => {
    async function createDocument() {
      const params = queryString.parse(location.search);

      try {
        const collection = await collections.fetch(id);
        const document = await documents.create({
          collectionId: collection.id,
          parentDocumentId: params.parentDocumentId?.toString(),
          templateId: params.templateId?.toString(),
          template: params.template === "true" ? true : false,
          title: "",
          text: "",
        });
        history.replace(editDocumentUrl(document), location.state);
      } catch (err) {
        showToast(t("Couldn’t create the document, try again?"), {
          type: "error",
        });
        history.goBack();
      }
    }

    createDocument();
  });

  return (
    <Flex column auto>
      <CenteredContent>
        <PlaceholderDocument />
      </CenteredContent>
    </Flex>
  );
}

export default observer(DocumentNew);
