import { observer } from "mobx-react";
import * as React from "react";
import Dropzone from "react-dropzone";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import LoadingIndicator from "~/components/LoadingIndicator";
import Text from "~/components/Text";
import useImportDocument from "~/hooks/useImportDocument";
import useToasts from "~/hooks/useToasts";

type Props = {
  disabled: boolean;
  accept: string;
  collectionId: string;
};

const DropToImport: React.FC<Props> = ({
  children,
  disabled,
  accept,
  collectionId,
}) => {
  const { handleFiles, isImporting } = useImportDocument(collectionId);
  const { showToast } = useToasts();
  const { t } = useTranslation();

  const handleRejection = React.useCallback(() => {
    showToast(
      t("Document not supported – try Markdown, Plain text, HTML, or Word"),
      {
        type: "error",
      }
    );
  }, [t, showToast]);

  return (
    <Dropzone
      accept={accept}
      onDropAccepted={handleFiles}
      onDropRejected={handleRejection}
      disabled={disabled}
      noClick
      multiple
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <DropzoneContainer
          {...getRootProps()}
          isDragActive={isDragActive}
          tabIndex={-1}
        >
          <input {...getInputProps()} />
          {isImporting && <LoadingIndicator />}

          {children}
          <DropMessage>{t("Drop documents to import")}</DropMessage>
        </DropzoneContainer>
      )}
    </Dropzone>
  );
};

const DropMessage = styled(Text)`
  opacity: 0;
  pointer-events: none;
`;

const DropzoneContainer = styled.div<{ isDragActive?: boolean }>`
  outline-color: transparent !important;
  height: calc(100% - 56px);
  position: relative;

  ${({ isDragActive, theme }) =>
    isDragActive &&
    css`
      &:after {
        display: block;
        content: "";
        position: absolute;
        top: 24px;
        right: 24px;
        left: 24px;
        height: 85vh;
        background: ${theme.background};
        border-radius: 8px;
        border: 1px dashed ${theme.divider};
        box-shadow: 0 0 0 100px ${theme.background};
        z-index: 1;
      }

      ${DropMessage} {
        opacity: 1;
        z-index: 2;
        position: absolute;
        text-align: center;
        top: 50vh;
        left: 50%;
        transform: translateX(-50%);
      }
    `}
`;

export default observer(DropToImport);
