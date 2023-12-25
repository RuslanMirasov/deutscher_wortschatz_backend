const nanoId = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_~';
  let randomId = '';
  for (let i = 0; i < 21; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    randomId += alphabet.charAt(randomIndex);
  }
  return randomId;
};

module.exports = nanoId;
