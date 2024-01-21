export const leftJson = {
  primitive: 1,
  primitive_change: 1,
  primitive_remove: 999,
  set_in_list: [
    {
      id: 1,
      label: "label:1",
      set: [1, 2, 3],
    },
    {
      id: 2,
      label: "label:2",
      set: [4, 5, 6],
    },
  ],
  list: [
    {
      id: 1,
      label: "label:1",
    },
    {
      id: 2,
      label: "label:2",
    },
    {
      id: 3,
      label: "label:3",
    },
    {
      id: 4,
      label: "label:4",
    },
    {
      id: 5,
      label: "label:5",
    },
    {
      id: 9,
      label: "label:the:same",
    },
  ],
  "list:matchWithField": [
    {
      customeId: 1,
      label: "label:1",
    },
    {
      customeId: 2,
      label: "label:2",
    },
    {
      customeId: 3,
      label: "label:3",
    },
    {
      customeId: 4,
      label: "label:4",
    },
    {
      customeId: 5,
      label: "label:5",
    },
    {
      customeId: 9,
      label: "label:the:same",
    },
  ],
  set_in_set: [
    {
      id: 1,
      label: "label:1",
      set: [1, 2, 3],
    },
    {
      id: 2,
      label: "label:2",
      set: [4, 5, 6],
    },
  ],
  set: [
    {
      id: 1,
      label: "label:1",
    },
    {
      id: 2,
      label: "label:2",
    },
    {
      id: 3,
      label: "label:3",
    },
    {
      id: 4,
      label: "label:4",
    },
    {
      id: 5,
      label: "label:5",
    },
    {
      id: 9,
      label: "label:the:same",
    },
  ],
  "set:matchWithField": [
    {
      customeId: 1,
      label: "label:1",
    },
    {
      customeId: 2,
      label: "label:2",
    },
    {
      customeId: 3,
      label: "label:3",
    },
    {
      customeId: 4,
      label: "label:4",
    },
    {
      customeId: 5,
      label: "label:5",
    },
    {
      customeId: 9,
      label: "label:the:same",
    },
  ],
};
export const rightJson = {
  primitive: 1,
  primitive_change: 888,
  primitive_add: 876,
  set_in_list: [
    {
      id: 1,
      label: "label:1",
      set: [1, 5, 3],
    },
    {
      id: 2,
      label: "label:2",
      set: [6, 5, 4],
    },
  ],
  list: [
    {
      id: 9,
      label: "label:9",
    },
    {
      id: 1,
      label: "label:111",
    },
    {
      id: 3,
      label: "label:3",
    },
    {
      id: 8,
      label: "label:8",
    },
    {
      id: 5,
      label: "label:5",
    },
    {
      id: 7,
      label: "label:7",
    },
    {
      id: 999,
      label: "label:the:same",
    },
  ],
  "list:matchWithField": [
    {
      customeId: 9,
      label: "label:9",
    },
    {
      customeId: 1,
      label: "label:111",
    },
    {
      customeId: 3,
      label: "label:333",
    },
    {
      customeId: 5,
      label: "label:5",
    },
    {
      customeId: 7,
      label: "label:7",
    },
    {
      customeId: 999,
      label: "label:the:same",
    },
  ],
  set_in_set: [
    {
      id: 2,
      label: "label:2",
      set: [6, 5, 4],
    },
    {
      id: 1,
      label: "label:1",
      set: [3, 2, 1],
    },
  ],
  set: [
    {
      id: 5,
      label: "label:5",
    },
    {
      id: 4,
      label: "label:4",
    },
    {
      id: 2,
      label: "label:2",
    },
    {
      id: 1,
      label: "label:111",
    },
    {
      id: 6,
      label: "label:6",
    },
    {
      id: 999,
      label: "label:the:same",
    },
  ],
  "set:matchWithField": [
    {
      customeId: 5,
      label: "label:5",
    },
    {
      customeId: 4,
      label: "label:4444",
    },
    {
      customeId: 2,
      label: "label:2222",
    },
    {
      customeId: 1,
      label: "label:1",
    },
    {
      customeId: 6,
      label: "label:6",
    },
    {
      customeId: 999,
      label: "label:the:same",
    },
  ],
};
export const jycmConfig = {
  operators: [
    {
      name: "operator:list:matchWithField",
      args: ["^list:matchWithField->\\[\\d+\\]$", "customeId"],
    },
    {
      name: "operator:list:matchWithField",
      args: ["^list:matchWithField->\\[\\d+\\]$", "customeId"],
    },
  ],
  ignore_orders: [
    "^set_in_list->\\[\\d+\\]->set$",
    "^set_in_set->\\[\\d+\\]->set$",
    "^set_in_set$",
    "^set$",
    "^set:matchWithField$",
  ],
};
