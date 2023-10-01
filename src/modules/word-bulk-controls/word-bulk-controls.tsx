import { Box, Button, Typography } from "@mui/material";
import { values } from "lodash";
import { Lang } from "../../shared/settings.types";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useUnit } from "effector-react";
import { fileUploadModel } from "../../models";
import {
  UploadedControlsContainer,
  WordBulkControlsContainer,
} from "./word-bulk-controls.styles";

export const WordBulkControls = () => {
  const actions = useUnit({
    selectFile: fileUploadModel.selectFile,
    processFile: fileUploadModel.processFile,
    clearSelectedFile: fileUploadModel.clearSelectedFile,
  });

  const file = useUnit(fileUploadModel.$file);

  return (
    <Box sx={WordBulkControlsContainer}>
      <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}
      >
        Click to Upload File
        <input
          key={file?.name}
          hidden
          onChange={(e) =>
            e.target.files && actions.selectFile(e.target.files[0])
          }
          type="file"
        />
      </Button>
      <Typography variant="caption">
        CSV format only available. File must have two columns. Column headers
        must be from the list of <b>{values(Lang).join(", ")}</b>.
      </Typography>

      {file && (
        <Box sx={UploadedControlsContainer}>
          <Typography variant="body1">{file.name} was selected.</Typography>
          <Button variant="contained" onClick={actions.clearSelectedFile}>
            Clear selected file
          </Button>
          <Button variant="contained" onClick={actions.processFile}>
            Process file
          </Button>
        </Box>
      )}
    </Box>
  );
};
