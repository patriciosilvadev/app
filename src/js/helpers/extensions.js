Array.prototype.flatten = function() {
  return this.length == 0 ? null : this[0]
}

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
}

String.prototype.timeToDecimal = function() {
  var arr = this.split(':')
  var dec = parseInt((arr[1] / 6) * 10, 10)

  return parseFloat(parseInt(arr[0], 10) + '.' + (dec < 10 ? '0' : '') + dec)
}

String.prototype.generateInitials = function() {
  if (this != '') {
    return this.split(' ')
      .map((part, _) => {
        return part[0] ? part[0].toUpperCase() : ''
      })
      .splice(0, 2)
      .toString()
      .replace(',', '')
      .trim()
  } else {
    return 'WD'
  }
}

String.prototype.splice = function(idx, rem, str) {
  return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem))
}
