document.addEventListener("alpine:init", () => {

    Alpine.data('pizzaCart', () => {
        return {
            title: 'Pizza Cart API',
            pizzas: [],
            username: '',
            cartId: '',
            cartPizzas: [],
            cartTotal: 0.00,
            paymentAmount: '',
            message: '',
            messageType: '',
            change: 0,
            pizzaHistory: [],
            cartData: [],
            featuredPizzas: [],
            showOrderHistory: false,
            showPizzaHistory: false,
            orderHistory: [],
            historicalOrders: [],
            filteredPizzas: [],
            cartData: {},
            selectedType: '',
            filterCriteria: 'type',
            selectedTypeOrSize: '',
            pizzaTypes: ['chicken', 'veggie', 'meaty'],
            pizzaSizes: ['small', 'medium', 'large'],



            login() {
                if (this.username.length > 2) {
                    localStorage['username'] = this.username;
                    this.createCart()
                    .then(() => {
                    this.fetchFeaturedPizzas();
                    this.fetchOrderHistory();
                    
                });
                } else {
                    alert("Username is too short");
                }
            },

            logout() {
                if (confirm('Do you want to logout?')) {
                    this.featuredPizzas = [];
                    this.username = '';
                    this.cartId = '';
                    localStorage['cartId'] = '';
                    localStorage['username'] = '';
                   
                }

            },

            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`
                return axios.get(getCartURL);
            },



            addPizza(pizzaId) {
                return axios.post(`https://pizza-api.projectcodex.net/api/pizza-cart/add`, {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                })
            },


            createCart() {
                if (!this.username) {

                    return Promise.resolve();
                }
                const cartId = localStorage['cartId'];

                if (cartId) {
                    this.cartId = cartId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`
                    return axios.get(createCartURL)
                        .then(result => {
                            this.cartId = result.data.cart_code;
                            localStorage['cartId'] = this.cartId;
                        });
                }
            },
            

            

            

            removePizza(pizzaId) {
                return axios.post(`https://pizza-api.projectcodex.net/api/pizza-cart/remove`, {
                    "cart_code": this.cartId,
                    "pizza_id": pizzaId
                });
            },

            pay(amount) {

                return axios.post(`https://pizza-api.projectcodex.net/api/pizza-cart/pay`,
                    {
                        "cart_code": this.cartId,
                        amount
                    })
            },

         
            manageFeaturedPizzas(pizzaId) {
                const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured`;
                axios.post(featuredPizzasURL, {
                    'username': this.username,
                    'pizza_id': pizzaId
                }).then(() => {
                    this.fetchFeaturedPizzas();
                });
            },

            fetchFeaturedPizzas() {
                const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
                axios.get(featuredPizzasURL).then((result) => {
                    this.featuredPizzas = result.data.pizzas;
                });
            },


            showCartData() {
                this.getCart().then(result => {
                    this.cartPizzas = result.data.pizzas;
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = cartData.total.toFixed(2);
                })
            },

            fetchOrderHistory() {
                axios
                .get(`https://pizza-api.projectcodex.net/api/pizza-cart/username/${this.username}`)
                .then ((res) => {
                    const carts = res.data;
                    carts.forEach((cart) => {
                        if (cart.status === 'paid') {
                            const cartCode =cart.cart_code;
                            axios
                            .get(`https://pizza-api.projectcodex.net/api/pizza-cart/${cartCode}/get`)
                            .then((res) => {
                                const cartData = res.data;
                                this.historicalOrders.push(cartData);
                                console.log(this.historicalOrders)
                            });
                        }
                    });
                });
            },


            init() {

                const storedUsername = localStorage['username'];
                if (storedUsername) {
                    this.username = storedUsername;
                    this.fetchFeaturedPizzas();
                   
                }


                axios
                    .get(`https://pizza-api.projectcodex.net/api/pizzas`)
                    .then(result => {
                        
                        this.pizzas = result.data.pizzas
                        this.filteredPizzas = this.pizzas; 
                        console.log('Loaded pizzas:', this.pizzas);

                    });
                   

                if (!this.cartId) {
                    this
                        .createCart()
                        .then(() => {
                            this.showCartData();
                        })
                }
                
                this.fetchFeaturedPizzas();
                this.fetchOrderHistory();
  

            },

            filterPizzas() {
                console.log('Selected type/size:', this.selectedTypeOrSize);  
                if (this.selectedTypeOrSize) {
                    this.filteredPizzas = this.pizzas.filter(pizza => {
                        console.log('Pizza', pizza);  
                        if (this.filterCriteria === 'type') {
                            return pizza.type === this.selectedTypeOrSize;
                        } else if (this.filterCriteria === 'size') {
                            return pizza.size === this.selectedTypeOrSize;
                        }
                    });
                } else {
                    this.filteredPizzas = this.pizzas;
                }
                console.log('Filtered pizzas:', this.filteredPizzas);  
            },
            
            addPizzaToCart(pizzaId) {
                this.addPizza(parseInt(pizzaId))
                    .then(() => {
                        this.showCartData();
                    })
                console.log(pizzaId)
            },

            removePizzaFromCart(pizzaId) {
               
                this.removePizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                    });

            },

            payForCart() {

                this
                    .pay(this.paymentAmount)
                    .then(result => {
                        if (result.data.status == 'failure') {
                            this.message = result.data.message;
                            this.messageType = 'error-message';
                            setTimeout(() => this.message = '', 3000);
                        } else {
                            this.message = 'Payment received. Enjoy your pizzas!';
                            this.messageType = 'success-message';


                            var localStorageData = JSON.parse(localStorage.getItem('pizzaHistory')) || [];
                            var pizzaHistoryArr = [...this.cartPizzas, ...localStorageData]
                            localStorage.setItem('pizzaHistory', JSON.stringify(pizzaHistoryArr))
                            console.log(pizzaHistoryArr)


                           

                            const amount = parseInt(this.paymentAmount)
                            if (amount > this.cartTotal) {

                                this.change = (amount - this.cartTotal);
                            } else {
                                this.change = 0;
                            }

                            setTimeout(() => {
                                this.message = '';
                                this.messageType = '';
                                this.change = 0;
                                this.cartPizzas = [];
                                this.cartTotal = 0.00
                                this.cartId = ''
                                this.paymentAmount = '';
                                localStorage['cartId'] = '';
                                this.createCart();
                            }, 3000);
                        }
                    })
            },

            clearCart() {
                this.cartPizzas = [];
                this.cartTotal = 0.00;
                localStorage.removeItem('cartId');
                this.createCart().then(() => {
                    this.showCartData();
                });
            },

        }
    })
});