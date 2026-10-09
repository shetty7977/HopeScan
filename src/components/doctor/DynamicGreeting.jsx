import React from 'react';

const DynamicGreeting = ({ name }) => {
  const date = new Date();
  const hours = date.getHours();
  let greeting;

  if (hours >= 5 && hours < 12) {
    greeting = 'Good Morning';
  } else if (hours >= 12 && hours < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  // If a name is provided, add it to the greeting. Otherwise, just show the greeting.
  return (
    <h1 className="text-3xl font-bold">
      {greeting}{name ? `, ${name}` : ''}
    </h1>
  );
};

export default DynamicGreeting;