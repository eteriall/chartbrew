import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  Modal, Button, Loader, Container, Placeholder, Message, Icon,
} from "semantic-ui-react";

import ApiBuilder from "./ApiBuilder";
import {
  getDataRequestByDataset as getDataRequestByDatasetAction,
  createDataRequest as createDataRequestAction,
  updateDataRequest as updateDataRequestAction,
} from "../../../actions/dataRequest";

function DatarequestModal(props) {
  const {
    open, onClose, connection, dataset, match, getDataRequestByDataset,
    createDataRequest, updateDataRequest,
  } = props;

  const [dataRequest, setDataRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [closeTrigger, setCloseTrigger] = useState(false);

  useEffect(() => {
    if (!open) {
      setDataRequest(null);
      return;
    }
    let fetched = false;
    getDataRequestByDataset(match.params.projectId, match.params.chartId, dataset.id)
      .then((result) => {
        fetched = true;
        setDataRequest(result);

        setTimeout(() => {
          setSaved(true);
        }, 100);
      })
      .catch((err) => {
        if (err && err.message === "404") {
          return createDataRequest(match.params.projectId, match.params.chartId, {
            dataset_id: dataset.id,
          });
        }
        setError("Cannot fetch the data request configuration. Try to refresh the page.");
        return err;
      })
      .then((result) => {
        if (!fetched && result) {
          setDataRequest(result);
          setTimeout(() => {
            setSaved(true);
          }, 100);
        }
      })
      .catch(() => {
        setError("Cannot fetch the data request configuration. Try to refresh the page.");
      });
  }, [open, dataset]);

  useEffect(() => {
    setSaved(false);
  }, [dataRequest]);

  const _onClose = () => {
    if (saved || closeTrigger) {
      setCloseTrigger(false);
      onClose();
    } else if (!saved) {
      setCloseTrigger(true);
    }
  };

  const _updateDataRequest = (newData) => {
    let newDr = newData;
    // transform the headers array
    if (newDr && newDr.formattedHeaders && newDr.formattedHeaders.length > 0) {
      const { formattedHeaders } = newDr;
      let newHeaders = {};
      for (let i = 0; i < formattedHeaders.length; i++) {
        if (formattedHeaders[i].key && formattedHeaders[i].value) {
          newHeaders = { [formattedHeaders[i].key]: formattedHeaders[i].value, ...newHeaders };
        }
      }

      newDr = { ...newDr, headers: newHeaders };
    }

    setDataRequest(newDr);
  };

  const _onSaveRequest = () => {
    setLoading(true);

    return updateDataRequest(
      match.params.projectId,
      match.params.chartId,
      dataRequest.id,
      dataRequest
    )
      .then((newDr) => {
        setLoading(false);
        setDataRequest(newDr);

        setTimeout(() => {
          setSaved(true);
        }, 100);

        return newDr;
      })
      .catch((e) => {
        setLoading(false);
        setError(e);
        return e;
      });
  };

  return (
    <Modal
      open={open}
      size="fullscreen"
      onClose={_onClose}
      closeOnDimmerClick={false}
      closeOnEscape={false}
    >
      <Modal.Header>{`Configure ${connection.name}`}</Modal.Header>
      <Modal.Content>
        {!dataRequest && (
          <Container>
            <Loader active inverted>Loading</Loader>
            <Placeholder>
              <Placeholder.Line />
              <Placeholder.Line />
              <Placeholder.Line />
              <Placeholder.Line />
              <Placeholder.Line />
            </Placeholder>
          </Container>
        )}
        {error && (
          <Message>
            <Message.Header>Could not fetch the data request</Message.Header>
            <p>Please try refreshing the page.</p>
          </Message>
        )}
        {connection.type === "api" && dataRequest && (
          <ApiBuilder
            dataset={dataset}
            dataRequest={dataRequest}
            connection={connection}
            onChangeRequest={_updateDataRequest}
            onSave={_onSaveRequest}
          />
        )}
      </Modal.Content>
      <Modal.Actions>
        {closeTrigger && <span>Are you sure? Your settings are not saved</span>}
        <Button
          negative={closeTrigger}
          onClick={_onClose}
          basic
        >
          Close
        </Button>
        <Button
          primary={!saved}
          positive={saved}
          onClick={_onSaveRequest}
          loading={loading}
        >
          {saved ? "Saved" : "Save"}
        </Button>
        <Button
          secondary
          icon
          labelPosition="right"
          disabled
        >
          <Icon name="chevron right" />
          Setup the fields
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

DatarequestModal.defaultProps = {
  open: false,
};

DatarequestModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  connection: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  getDataRequestByDataset: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  createDataRequest: PropTypes.func.isRequired,
  updateDataRequest: PropTypes.func.isRequired,
};

const mapStateToProps = () => {
  return {
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    getDataRequestByDataset: (projectId, chartId, datasetId) => {
      return dispatch(getDataRequestByDatasetAction(projectId, chartId, datasetId));
    },
    createDataRequest: (projectId, chartId, data) => {
      return dispatch(createDataRequestAction(projectId, chartId, data));
    },
    updateDataRequest: (projectId, chartId, drId, data) => {
      return dispatch(updateDataRequestAction(projectId, chartId, drId, data));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DatarequestModal));
