# Stitching Directive

## Getting Started

```bash
$ yarn district     // run district service
$ yarn division     // run division service
$ yarn gateway      // run gateway service
```

```graphql
# failing query. unable to map districts where divisions.id === districts.divisionId. dataloader throwing key-value length mismatch.
query divisions{
  divisions {
    id
    name
    districts {
      id
      name
      divisionId
    }
  }
}

query districts{
  districts {
    id
    name
    division {
      id
      name
    }
  }
}
```