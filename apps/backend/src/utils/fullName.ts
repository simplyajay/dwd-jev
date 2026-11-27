interface NameParts {
  firstName: string;
  middleName: string | null;
  lastName: string;
}

// "Last, First Middle" -- middle omitted when null or blank.
export const formatFullName = ({ firstName, middleName, lastName }: NameParts): string => {
  const given = middleName?.trim() ? `${firstName} ${middleName.trim()}` : firstName;
  return `${lastName}, ${given}`;
};
