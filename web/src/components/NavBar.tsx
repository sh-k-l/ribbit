import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useMeQuery } from '../generated/graphql';

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();

  let body = null;

  if (fetching) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link color="white" mr={2}>
            login
          </Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white" mr={2}>
            register
          </Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Box>
        <Flex ml={'auto'}>
          <Box color="white" mr={2}>
            {data.me.username}
          </Box>
          <Button variant="link" mr={2}>
            logout
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Flex bg="green" p={4} ml={'auto'}>
      <Box ml="auto">{body}</Box>
    </Flex>
  );
};
