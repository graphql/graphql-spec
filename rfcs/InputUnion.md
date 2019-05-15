RFC: GraphQL Input Union
----------

## Possible Solutions

### Value-based Discriminator field

These options rely the _value_ of a particular input field to determine the concrete type.

#### Single `__typename` field; value is the `type`

```graphql
input SummaryMetric {
  min: Integer
  max: Integer
}
input CounterMetric {
  count: Integer
}
input HistogramMetric {
  percentiles: [Integer]
}

inputUnion MetricInputUnion = SummaryMetric | CounterMetric | HistogramMetric

{__typename: "SummaryMetric", min: 123, max: 456}
{__typename: "CounterMetric", count: 789}
{__typename: "HistogramMetric", percentiles: [12, 34, 56, 78, 90]}
```

#### Single user-chosen field; value is the `type`

```graphql
input SummaryMetric {
  metricType: <MetricInputUnion>
  min: Integer
  max: Integer
}
input CounterMetric {
  metricType: <MetricInputUnion>
  count: Integer
}
input HistogramMetric {
  metricType: <MetricInputUnion>
  percentiles: [Integer]
}

inputUnion MetricInputUnion = SummaryMetric | CounterMetric | HistogramMetric

{metricType: "SummaryMetric", min: 123, max: 456}
{metricType: "CounterMetric", count: 789}
{metricType: "HistogramMetric", percentiles: [12, 34, 56, 78, 90]}
```

#### Single user-chosen field; value is a literal

```graphql
enum MetricType {
  SUMMARY
  COUNTER
  HISTOGRAM
}
input SummaryMetric {
  metricType: MetricType::SUMMARY
  min: Integer
  max: Integer
}
input CounterMetric {
  metricType: MetricType::COUNTER
  count: Integer
}
input HistogramMetric {
  metricType: MetricType::HISTOGRAM
  percentiles: [Integer]
}

inputUnion MetricInputUnion = SummaryMetric | CounterMetric | HistogramMetric

{metricType: SUMMARY, min: 123, max: 456}
{metricType: COUNTER, count: 789}
{metricType: HISTOGRAM, percentiles: [12, 34, 56, 78, 90]}
```

### Structural Discrimination

These options rely on the _structure_ of the input to determine the concrete type.

#### Unique structure

Schema Rule: Each type in the union must have a unique set of required fields

```graphql
input SummaryMetric {
  name: String!
  min: Float!
  max: Float!
  count: Integer
}
input CounterMetric {
  name: String!
  count: Integer!
}
input HistogramMetric {
  name: String!
  percentiles: [Integer]!
  width: Integer
}

inputUnion MetricInputUnion = SummaryMetric | CounterMetric | HistogramMetric

{name: "my.metric", min: 123.4, max: 456.7, count: 89}
{name: "my.metric", count: 789}
{name: "my.metric", percentiles: [12, 34, 56, 78, 90]}
```

Problems:

* Optional fields could prevent determining a unique type

