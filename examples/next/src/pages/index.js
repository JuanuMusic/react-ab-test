import { withIronSession } from 'next-iron-session';
import { v4 as UUID } from 'uuid';

import Experiment from '../../../../lib/Experiment';
import Variant from '../../../../lib/Variant';
import abTestsEmitter from '../../../../lib/emitter';
// Normally the library would be imported with:
// import { Experiment, Variant, experimentDebugger, emitter } from '@juanu/react-ab-test'

export default function Home({ userIdentifier }) {
  return <AbTest userIdentifier={userIdentifier} />;
}

function AbTest({ userIdentifier }) {
  return (
    <div>
      <Experiment name="My Example" userIdentifier={userIdentifier}>
        <Variant name="A">
          <div>Section A</div>
        </Variant>
        <Variant name="B">
          <div>Section B</div>
        </Variant>
      </Experiment>
    </div>
  );
}

const getServerSideProps = withIronSession(
  async ({ req }) => {
    abTestsEmitter.rewind();
    let userIdentifier = req.session.get('id');
    if (!userIdentifier) {
      userIdentifier = UUID();
      req.session.set('id', userIdentifier);
      await req.session.save();
    }
    return {
      props: {
        userIdentifier,
      },
    };
  },
  {
    password:
      'fe8Ers3YMghbyGH4XQhZfe8Ers3YMghbyGH4XQhZfe8Ers3YMghbyGH4XQhZfe8Ers3YMghbyGH4XQhZ',
    cookieName: 'session',
  }
);

export { getServerSideProps };
