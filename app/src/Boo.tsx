import React from 'react';
import { Text, Image } from 'react-native';

export const Boo = ({

}) => {
  return (
    <>
      <Text>
        I am very third version of boo and also gota new dog pic
        <Image
          source={require('../assets/dog2.jpg')}
          style={{ width: 150, height: 150 }}
          onError={e => console.error(e)}
        />
      </Text>
    </>
  );
};
