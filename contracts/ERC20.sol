// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// FOR TESTS ONLY
contract Token is ERC20 {
    uint16 constant PRESICION = 1000;

    uint16 comission;

    mapping(address => bool) public whitelist;

    constructor(string memory _name, string memory _symbol, uint16 _comission) ERC20(_name, _symbol) {
        require(_comission <= PRESICION, "INVALID COMISSION");
        comission = _comission;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // without onlyOwner because of tests
    function setWhitelist(address account, bool flag) public {
        whitelist[account] = flag;
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();

        if (whitelist[to] || comission == PRESICION) {
            _transfer(owner, to, amount);
        } else {
            uint256 transferAmount = amount * comission / PRESICION;
            _transfer(owner, address(this), transferAmount);
            _transfer(owner, to, amount - transferAmount);
        }

        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);

        if (whitelist[to] || comission == PRESICION) {
            _transfer(from, to, amount);
        } else {
            uint256 transferAmount = amount * comission / PRESICION;

            _transfer(from, address(this), transferAmount);
            _transfer(from, to, amount - transferAmount);
        }

        return true;
    }
}