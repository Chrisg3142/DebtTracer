  //this is to see the file name when someone 
    //chooses a file to change their profile picture
    var profilepic = document.getElementById('profilePic')
    profilepic.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        document.querySelector('.custom-file-label').textContent = this.files[0].name;
      }
    });