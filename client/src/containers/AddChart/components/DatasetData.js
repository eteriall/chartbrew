import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import {
  Dropdown, Icon, Input, Button, Grid, Message, Popup,
} from "semantic-ui-react";
import uuid from "uuid/v4";
import _ from "lodash";

import { runRequest as runRequestAction } from "../../../actions/dataset";
import fieldFinder from "../../../modules/fieldFinder";

const operators = [{
  key: "=",
  text: "= (is)",
  value: "is",
}, {
  key: "≠",
  text: "≠ (is not)",
  value: "isNot",
}, {
  key: ">",
  text: "> (greater than)",
  value: "greaterThan",
}, {
  key: "≥",
  text: "≥ (greater or equal)",
  value: "greaterOrEqual",
}, {
  key: "<",
  text: "< (less than)",
  value: "lessThan",
}, {
  key: "≤",
  text: "≤ (less or equal)",
  value: "lessOrEqual",
}, {
  key: "∈",
  text: "∈ (contains)",
  value: "contains",
}, {
  key: "∉",
  text: "∉ (does not contain)",
  value: "notContains",
}];

const operations = [{
  key: "none",
  text: "No operation",
  value: "none",
}, {
  key: "count",
  text: "Count",
  value: "count",
}, {
  key: "sum",
  text: "Sum",
  value: "sum",
}, {
  key: "avg",
  text: "Average",
  value: "avg",
}];

function DatasetData(props) {
  const {
    dataset, requestResult, onUpdate, runRequest, match,
  } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [conditions, setConditions] = useState([{
    id: uuid(),
    field: "",
    operator: "is",
    value: "",
  }]);

  // Update the content when there is some data to work with
  useEffect(() => {
    if (requestResult && requestResult.data) {
      const tempFieldOptions = [];
      fieldFinder(requestResult.data).forEach((field) => {
        tempFieldOptions.push({
          key: field,
          text: field.replace("root[].", ""),
          value: field,
        });
      });
      setFieldOptions(tempFieldOptions);
    }
  }, [requestResult]);

  // Update the conditions
  useEffect(() => {
    if (dataset.conditions && dataset.conditions.length > 0) {
      let newConditions = [...conditions];

      // in case of initialisation, remove the first empty condition
      if (newConditions.length === 1 && !newConditions[0].saved && !newConditions[0].value) {
        newConditions = [];
      }

      const toAddConditions = [];
      for (let i = 0; i < dataset.conditions.length; i++) {
        let found = false;
        for (let j = 0; j < newConditions.length; j++) {
          if (newConditions[j].id === dataset.conditions[i].id) {
            newConditions[j] = dataset.conditions[i];
            found = true;
          }
        }

        if (!found) toAddConditions.push(dataset.conditions[i]);
      }

      setConditions(newConditions.concat(toAddConditions));
    }
  }, [dataset]);

  const _selectXField = (e, data) => {
    onUpdate({ xAxis: data.value });
  };

  const _selectYField = (e, data) => {
    onUpdate({ yAxis: data.value });
  };

  const _selectYOp = (e, data) => {
    onUpdate({ yAxisOperation: data.value });
  };

  const _updateCondition = (id, data, type) => {
    const newConditions = conditions.map((condition) => {
      const newCondition = condition;
      if (condition.id === id) {
        newCondition[type] = data.value;
        newCondition.saved = false;
      }

      return newCondition;
    });

    setConditions(newConditions);
  };

  const _onApplyCondition = (id) => {
    const newConditions = conditions.map((item) => {
      const newItem = { ...item };
      if (item.id === id) newItem.saved = true;

      return newItem;
    });

    _onSaveConditions(newConditions);
  };

  const _onAddCondition = () => {
    const newConditions = [...conditions, {
      id: uuid(),
      field: "",
      operator: "is",
      value: "",
      saved: false,
    }];

    setConditions(newConditions);
  };

  const _onRemoveCondition = (id) => {
    let newConditions = [...conditions];
    newConditions = newConditions.filter((condition) => condition.id !== id);

    if (newConditions.length === 0) {
      newConditions.push({
        id: uuid(),
        field: "",
        operator: "is",
        value: "",
        saved: false,
      });
    }

    setConditions(newConditions);
    _onSaveConditions(newConditions);
  };

  const _onSaveConditions = (newConditions) => {
    const savedConditions = newConditions.filter((item) => item.saved);
    onUpdate({ conditions: savedConditions });
  };

  const _onRefreshData = () => {
    setLoading(true);
    return runRequest(match.params.projectId, match.params.chartId, dataset.id)
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || err);
        setLoading(false);
      });
  };

  if (!requestResult) {
    return (
      <div>
        <Button
          primary
          size="small"
          icon
          labelPosition="right"
          onClick={_onRefreshData}
          loading={loading}
        >
          <Icon name="refresh" />
          Fetch the data
        </Button>
        {error && (
          <Message warning>
            <Message.Header>Error fetching data</Message.Header>
            <p>{error.message}</p>
          </Message>
        )}
      </div>
    );
  }

  return (
    <Grid style={styles.mainGrid} centered stackable>
      <Grid.Row columns={2}>
        <Grid.Column width={6}>
          <label>{"X Axis "}</label>
          <Dropdown
            icon={null}
            button
            className="small button"
            options={fieldOptions}
            search
            text={(dataset.xAxis && dataset.xAxis.replace("root[].", "")) || "Select a field"}
            onChange={_selectXField}
            scrolling
          />
        </Grid.Column>
        <Grid.Column width={10}>
          <label>{"Y Axis "}</label>
          <Dropdown
            icon={null}
            button
            className="small button"
            options={fieldOptions}
            search
            text={(dataset.yAxis && dataset.yAxis.replace("root[].", "")) || "Select a field"}
            onChange={_selectYField}
            scrolling
          />
          <Dropdown
            icon={null}
            button
            className="small button"
            options={operations}
            search
            text={
              (dataset.yAxisOperation
                && operations.find((i) => i.value === dataset.yAxisOperation).text
              )
              || "Operation"
            }
            onChange={_selectYOp}
            scrolling
          />
        </Grid.Column>
      </Grid.Row>
      {conditions.map((condition, index) => {
        return (
          <Grid.Row key={condition.id} style={styles.conditionRow}>
            <Grid.Column>
              {index === 0 && (<label>{"where "}</label>)}
              {index > 0 && (<label>{"and "}</label>)}
              <Dropdown
                icon={null}
                className="small button"
                button
                options={fieldOptions}
                search
                text={(condition.field && condition.field.replace("root[].", "")) || "field"}
                onChange={(e, data) => _updateCondition(condition.id, data, "field")}
              />
              <Dropdown
                icon={null}
                button
                className="small button"
                options={operators}
                search
                text={
                  (
                    _.find(operators, { value: condition.operator })
                    && _.find(operators, { value: condition.operator }).key
                  )
                  || "="
                }
                onChange={(e, data) => _updateCondition(condition.id, data, "operator")}
              />
              <Input
                placeholder="Enter a value"
                size="small"
                value={condition.value}
                onChange={(e, data) => _updateCondition(condition.id, data, "value")}
              />

              <Popup
                trigger={(
                  <Button
                    icon
                    basic
                    style={styles.addConditionBtn}
                    onClick={() => _onRemoveCondition(condition.id)}
                  >
                    <Icon name="minus" />
                  </Button>
                )}
                content="Remove condition"
                position="top center"
              />

              {index === conditions.length - 1 && (
                <Popup
                  trigger={(
                    <Button
                      icon
                      basic
                      style={styles.addConditionBtn}
                      onClick={_onAddCondition}
                    >
                      <Icon name="plus" />
                    </Button>
                  )}
                  content="Add a new condition"
                  position="top center"
                />
              )}

              {!condition.saved && condition.value && (
                <Popup
                  trigger={(
                    <Button
                      icon
                      basic
                      style={styles.addConditionBtn}
                      onClick={() => _onApplyCondition(condition.id)}
                    >
                      <Icon name="checkmark" color="green" />
                    </Button>
                  )}
                  content="Apply this condition"
                  position="top center"
                />
              )}
            </Grid.Column>

          </Grid.Row>
        );
      })}
    </Grid>
  );
}

const styles = {
  addConditionBtn: {
    boxShadow: "none",
  },
  conditionRow: {
    paddingTop: 5,
    paddingBottom: 5,
  },
};

DatasetData.defaultProps = {
  requestResult: null,
};

DatasetData.propTypes = {
  dataset: PropTypes.object.isRequired,
  requestResult: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  runRequest: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
};

const mapStateToProps = () => ({});
const mapDispatchToProps = (dispatch) => {
  return {
    runRequest: (projectId, chartId, datasetId) => {
      return dispatch(runRequestAction(projectId, chartId, datasetId));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DatasetData));