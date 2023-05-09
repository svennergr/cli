import {
    ArgumentNode,
    VariableDefinitionNode,
    Kind,
    FieldDefinitionNode,
    TypeNode,
    NameNode,
    DocumentNode
} from "graphql";

// Default location
export const loc: any = {
    start: 0,
    end: 0,
    startToken: null,
    endToken: null,
    source: null,
  };

export function getTypeName(type: TypeNode): string {
    if (type?.kind === Kind.NAMED_TYPE) {
      return type.name.value;
    } else if (type?.kind === Kind.LIST_TYPE) {
      return getTypeName(type.type);
    } else if (type?.kind === Kind.NON_NULL_TYPE) {
      return getTypeName(type.type);
    } else {
      throw new Error(`Cannot get name of type: ${type}`);
    }
  }

  export function getDocumentDefinition(definitions: any): DocumentNode {
    return {
      kind: Kind.DOCUMENT,
      definitions,
      loc,
    };
  }

  export function getName(name: string): NameNode {
    return {
      kind: Kind.NAME,
      value: name,
    };
  }

  function getVariable(argName: string, varName: string): ArgumentNode {
    return {
      kind: Kind.ARGUMENT,
      loc,
      name: getName(argName),
      value: {
        kind: Kind.VARIABLE,
        name: getName(varName),
      },
    };
  }

  function getVariableDefinition(
    name: string,
    type: TypeNode
  ): VariableDefinitionNode {
    return {
      kind: Kind.VARIABLE_DEFINITION,
      type: type,
      variable: {
        kind: Kind.VARIABLE,
        name: getName(name),
      },
    };
  }

let isFirst = true;
export const generateFieldsAndVarsForMutation = ({
    node,
    parentNode = null,
    crossReferenceList = [],
    schema,
  }: any) => {
    const mutationTypeName = getTypeName(node.type);
    const mutationFieldTyping = schema.getType(mutationTypeName) as any;
    const fields = mutationFieldTyping?.astNode?.fields;
    const selections: any[] = [];
    const args: ArgumentNode[] = [];
    const variableDefinitionsMap: {
      [varName: string]: VariableDefinitionNode;
    } = {};

    node?.arguments?.forEach((arg: any) => {
      // if (!isNonNullType(arg.type)) return

      const varName = arg.name.value;
      variableDefinitionsMap[varName] = getVariableDefinition(varName, arg.type);
      args.push(getVariable(arg.name.value, varName));
    });

    const selectionSet: { kind: Kind; selections: any[] } = {
      kind: Kind.SELECTION_SET,
      selections: [],
    };

    selections.push({
      kind: Kind.FIELD,
      name: getName(node.name.value),
      selectionSet,
      arguments: args,
    });

    // some type definitions can recurse forever, so we keep a list to identify when we're in a loop
    const crossReferenceKey = `${parentNode?.name?.value}To${node?.name?.value}`;

    if (crossReferenceList.find((item: any) => item === crossReferenceKey))
      return { selections, variableDefinitionsMap };

    crossReferenceList.push(crossReferenceKey);

    fields?.forEach((field: FieldDefinitionNode) => {
      const fieldTypeName = getTypeName(field.type);
      const fieldTyping = schema.getType(fieldTypeName);

      if (!field.name.value.includes("userErrors") && isFirst) return;

      isFirst = false;

      // if (!isNonNullType(field.type)) return

      if (fieldTyping?.getFields) {
        const { selections: nextSelections } = generateFieldsAndVarsForMutation({
          node: field,
          parentNode: node,
          schema,
          crossReferenceList,
        });
        selectionSet.selections.push(nextSelections);
      } else {
        const selection = {
          kind: Kind.FIELD,
          name: getName(field.name.value),
          arguments: [],
        };

        selectionSet.selections.push(selection);
      }
    });

    isFirst = true;

    return { selections, variableDefinitionsMap };
  };
