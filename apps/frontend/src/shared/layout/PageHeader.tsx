import { PropsWithChildren } from "react";
import styled from "styled-components";

interface PageHeaderProps extends PropsWithChildren {
  title: string;
  description: string;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <Header>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <Actions>{children}</Actions>}
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 1.2;
  }

  p {
    max-width: 760px;
    margin: 8px 0 0;
    color: ${({ theme }) => theme.color.textMuted};
    line-height: 1.55;
  }

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
`;
