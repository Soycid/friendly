<script>
  import { onMount, afterUpdate } from 'svelte';
  import io from 'socket.io-client';


  
  let socket;
  let name = '';
  let lobbyId = '';
  let lobby = {};
  let joined = false;
  let canvas, ctx;
  let drawing = false;
  let color = '#000000';

  const updateLobby = (newLobby) => {
    lobby = { ...newLobby };
  };
  let isPublic = false;
  let publicLobbies = [];

  onMount(() => {
    socket = io('http://localhost:3001');
    socket.on('lobbyCreated', (id) => {
      updateLobby(name);
      lobbyId = id;

    });
    socket.on('lobbyUpdate', (newLobby, isPublicLobby) => {
      updateLobby(newLobby);
      isPublic = isPublicLobby;
    });
    socket.on('lobbyError', (error) => {
      alert(error);
    });
    socket.on('publicLobbiesUpdate', (updatedPublicLobbies) => {
      publicLobbies = updatedPublicLobbies;
    });

    socket.emit('getPublicLobbies');
  });

  afterUpdate(() => {
    if (joined && canvas) {
      ctx = canvas.getContext('2d');
    }
  });

  function createLobby() {
    if (name.trim() !== '') {
      socket.emit('createLobby', { name, isPublic });
      joined = true;
    }
  }

  function joinLobby() {
  if (name.trim() !== '' && lobbyId.trim() !== '') {
    socket.emit('joinLobby', { lobbyId, name });
    joined = true;
  }
}


  function startDrawing(event) {
    drawing = true;
    draw(event);
  }

  function stopDrawing() {
    drawing = false;
    ctx.beginPath();
  }

  function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function submitDrawing() {
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    // Emit the drawing data to the server
    socket.emit('drawing', { lobbyId, dataURL });
    clearCanvas();
  }
  // ... (rest of the existing drawing-related functions)
</script>

<!-- Add the following styles for the lobby and name input -->


<!-- Update the markup to include the name input and lobby list -->
<div class="container">
  {#if !joined}
  <label for="name">Enter your name: </label>
  <input type="text" id="name" bind:value="{name}" />

  <label for="lobbyId">Enter lobby ID to join: </label>
  <input type="text" id="lobbyId" bind:value="{lobbyId}" />

  <div class="public-option">
    <label for="isPublic">Make lobby public:</label>
    <input type="checkbox" id="isPublic" bind:checked="{isPublic}" />
  </div>

  <button on:click="{createLobby}">Create Lobby</button>
  <button on:click="{joinLobby}">Join Lobby</button>

  <h3>Public Lobbies:</h3>
  <ul>
    {#each publicLobbies as publicLobby}
      <li>
        <button on:click={() => (lobbyId = publicLobby)}>{publicLobby}</button>
      </li>
    {/each}
  </ul>
  {:else}
    <canvas
      bind:this="{canvas}"
      width="500"
      height="400"
      on:mousedown="{startDrawing}"
      on:mousemove="{draw}"
      on:mouseup="{stopDrawing}"
      on:mouseout="{stopDrawing}"
    ></canvas>
    <div class="tools">
      <label for="color">Color: </label>
      <input type="color" id="color" bind:value="{color}" />
      <button on:click="{clearCanvas}">Clear</button>
      <button on:click="{submitDrawing}">Submit</button>
    </div>
    <div class="lobby">
      <h3>Lobby {lobbyId}:</h3>
      {#each Object.entries(lobby) as [id, player]}
        {#if player === name}
          <div class="player" id="{id}">{player} (You)</div>
        {:else}
          <div class="player" id="{id}">{player}</div>
        {/if}
      {/each}
    </div>
  {/if}
</div>



<style>
  :global(body) {
    background-color: #1d1c21;
    font-family: 'Press Start 2P', cursive;
    margin: 0;
    padding: 0;
  }
  .public-option {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .lobby {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 15px;
  }

  .player {
    font-size: 14px;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: #ffffff;
  }

  canvas {
    border: 5px solid #8b5cf6;
    background-color: #ffffff;
    cursor: crosshair;
  }

  .tools {
    display: flex;
    flex-direction: row;
    gap: 10px;
    margin-top: 15px;
  }

  button {
    font-family: 'Press Start 2P', cursive;
    font-size: 12px;
    background-color: #4b86b4;
    color: #ffffff;
    border: 3px solid #2c5282;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background-color: #2c5282;
  }
</style>
