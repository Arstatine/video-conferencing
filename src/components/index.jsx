import { Box, Container, IconButton, Toolbar } from '@mui/material';

import CallEndIcon from '@mui/icons-material/CallEnd';

import { useEffect, useState } from 'react';

import AgoraRTC from 'agora-rtc-sdk-ng';

import { VideoPlayer } from './VideoPlayer';

const APP_ID = 'Add your Agora Web SDK app id here...';
const TOKEN = 'Add your Agora Web SDK token here...';
const CHANNEL = 'Add your Agora Web SDK Channel name here...';

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

const Video = () => {
  // creating users and local tracks
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);

  // handles user joined
  const handleUserJoined = async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      setUsers((previousUsers) => [...previousUsers, user]);
    }

    if (mediaType === 'audio') {
      user.audioTrack.play();
    }
  };

  // handles user left
  const handleUserLeft = (user) => {
    setUsers((previousUsers) =>
      previousUsers.filter((u) => u.uid !== user.uid)
    );
  };

  // handles configuration for audio and video tracks
  useEffect(() => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    client
      .join(APP_ID, CHANNEL, TOKEN, null)
      .then((uid) =>
        Promise.all([
          AgoraRTC.createMicrophoneAndCameraTracks({
            audioConfig: {
              ANS: true,
            },
            videoConfig: {
              facingMode: 'user',
            },
          }),
          uid,
        ])
      )
      .then(([tracks, uid]) => {
        const [audioTrack, videoTrack] = tracks;
        setLocalTracks(tracks);
        setUsers((previousUsers) => [
          ...previousUsers,
          {
            uid,
            videoTrack,
            audioTrack,
          },
        ]);
        client.publish(tracks);
      })

    return () => {
      for (let localTrack of localTracks) {
        localTrack.stop();
        localTrack.close();
      }
      client.off('user-published', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, []);

  return (
    <Box height="100vh" bgcolor="#363740" overflow="hidden">
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          height: 'inherit',
        }}
      >
        {/* list of user */}
        <Box
          display="grid"
          gap="8px"
          gridTemplateColumns="repeat(2, minmax(100px, 50%))"
          justifyContent="center"
          alignContent={users?.length > 8 ? 'start' : 'center'}
          height={{ xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' }}
          mb={2}
          sx={{ overflowY: 'auto' }}
          className="video"
          p={1}
        >
          {users?.map((user, index) => (
            <VideoPlayer key={index} user={user} />
          ))}
        </Box>

        {/* control */}
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '& > button': {
              mx: 1,
            },
            mb: 2,
          }}
        >
          {/* leave call */}
          <IconButton
            size="large"
            sx={{
              bgcolor: '#d32f2f',
              color: '#f2f2f2',
              '&:hover': { bgcolor: '#d32f2f' },
            }}
            onClick={() => {
              alert('Please check your device microphone and camera. Make sure that the mic and camera is working use this feature.');
              window.location.href = "https://video-conf-blue.vercel.app";
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Toolbar>
      </Container>
    </Box>
  );
};

export default Video;
