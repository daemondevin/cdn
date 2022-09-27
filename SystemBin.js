/**
 * ## SystemBin
 * 
 * A virtual filesystem implementation
 * 
 */
const vfs = function SystemBin() {
    let self = this;

    this.tree = new TreeStructure();
    this.tree.insert("", null, {
        type: "directory"
    });
    this.pointer = this.tree.root;

    SystemBin.prototype.mkdir = function (path) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        }
        let segments = path.replace(/\/+$/g, "").split("/");
        let parent = self._resolve_path(
            segments.slice(0, segments.length - 1).join("/")
        );
        let name = segments[segments.length - 1];
        if (parent.find(name).length) {
            throw new Error("Name already taken: " + name);
        }
        this.tree.insert(name, parent, {
            type: "directory"
        });
    };

    SystemBin.prototype.rmdir = function (path) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        }
        let node = self._resolve_path(path.replace(/\/+$/g, ""));
        if (node === this.tree.root) {
            throw new Error("You cannot delete the root directory.");
        } else if (node.type !== "directory") {
            throw new Error("Not a directory: " + node.key);
        }
        this.tree.delete(node);
        let current_path = self._absolute_path(this.pointer);
        let node_path = self._absolute_path(node);
        if (node_path.match("^" + current_path) && current_path.length) {
            this.pointer = node.parent;
        }
    };

    SystemBin.prototype.cd = function (path) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        }
        this.pointer = self._resolve_path(path);
        return this.pointer;
    };

    SystemBin.prototype.cat = function (mode, path, contents) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        }
        let segments = path.replace(/\/+$/g, "").split("/");
        let parent = self._resolve_path(segments.slice(0, segments.length - 1).join("/"));
        let name = segments[segments.length - 1];
        let node = parent.find(name)[0];
        if (node && node.type !== "file") {
            throw new Error("Not a file: " + path);
        } else if (mode.length) {
            if (node === undefined) {
                node = this.tree.insert(name, parent, {
                    type: "file",
                    lastModified: new Date().getTime(),
                    size: "",
                    contents: ""
                });
            }
            node.size = mode === ">" ? new Blob([contents]).size : new Blob([node.contents + contents]).size;
            node.contents = mode === ">" ? contents : node.contents + contents;
        } else {
            if (node === undefined) {
                throw new Error("File not found: " + path);
            }
            return node.contents;
        }
    };

    SystemBin.prototype.rm = function (path) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        }
        let node = self._resolve_path(path.replace(/\/+$/g, ""));
        if (node.type !== "file") {
            throw new Error("Not a file: " + node.key);
        }
        this.tree.delete(node);
    };

    SystemBin.prototype.rn = function (path, name) {
        if (path === undefined) {
            throw new TypeError("Missing argument: path");
        } else if (name === undefined) {
            throw new TypeError("Missing argument: name");
        }
        let node = self._resolve_path(path);
        if (node === this.tree.root) {
            throw new Error("You cannot rename the root directory.");
        }
        let search = node.parent.find(name)[0];
        if (search && search.type === node.type) {
            throw new Error("Rename failed. Name already taken.");
        }
        node.key = name;
    };

    SystemBin.prototype.cp = function (target, destination) {
        if (target === undefined) {
            throw new TypeError("Missing argument: target");
        } else if (destination === undefined) {
            throw new TypeError("Missing argument: destination");
        }
        target = typeof target === "object" ? target : self._resolve_path(target);
        destination = typeof destination === "object" ? destination : self._resolve_path(destination);
        let properties = {
            type: target.type
        };
        if (properties.type === "file") {
            properties.contents = target.contents;
            properties.lastModified = target.lastMoodified;
            properties.size = target.size;
        }
        let node = this.tree.insert(target.key, destination, properties);
        for (let i = 0; i < target.children.length; i++) {
            self.cp(target.children[i], node);
        }
        return node;
    };

    SystemBin.prototype.mv = function (target, destination) {
        if (target === undefined) {
            throw new TypeError("Missing argument: target");
        } else if (destination === undefined) {
            throw new TypeError("Missing argument: destination");
        }
        target = typeof target === "object" ? target : self._resolve_path(target);
        destination = typeof destination === "object" ? destination : self._resolve_path(destination);
        this.tree.delete(target);
        return self.cp.call(this, target, destination);
    };

    SystemBin.prototype.ls = function (path) {
        let node = path === undefined ? this.pointer : self._resolve_path(path);
        if (node.type === "directory") {
            return node.children;
        }
        throw new Error("Not a directory: " + path);
    };

    SystemBin.prototype.whereis = function (query) {
        if (query === undefined) {
            throw new TypeError("Missing argument: query");
        }
        return this.tree.search(query);
    };

    SystemBin.prototype._resolve_path = function (path) {
        path = path.match("^/") ? path : "./" + path;
        path = path.split("/");
        let parent = path[0].length ? this.pointer : this.tree.root;
        for (let i = !path[0].length ? 1 : 0; i < path.length; i++) {
            if (path[i] === "..") {
                if (parent === this.tree.root) {
                    throw new Error( "No more directories beyond root directory.");
                }
                parent = parent.parent;
            } else if (path[i] !== "." && path[i].length) {
                parent = parent.find(path[i])[0];
                if (parent === undefined) {
                    throw new Error("Path not found: " + path.slice(0, i + 1).join("/"));
                }
            }
        }
        return parent;
    };

    SystemBin.prototype._absolute_path = function (node) {
        let path = [];
        while (node !== null) {
            path.unshift(node.key);
            node = node.parent;
        }
        return path.join("/");
    };
};

function TreeStructure() {
    this.root = null;

    this.insert = function (key, parent, properties) {
        if (key === undefined) {
            throw new TypeError("Missing argument: key");
        }
        parent = parent instanceof TreeNode ? [parent] : this.search(parent);
        let node = new TreeNode(key, properties);
        if (parent === null && !this.root) {
            this.root = node;
        } else if (parent === null && !!this.root) {
            throw new Error("TreeStructure already has a root. Please specify the node's parent.");
        } else if (!parent.length) {
            throw new Error("Parent node not found.");
        } else {
            parent[0].insert(node);
        }
        return node;
    };

    this.delete = function (node) {
        if (node === undefined) {
            throw new TypeError("Missing argument: node");
        }
        let targets = node instanceof TreeNode ? [node] : this.search(node);
        if (targets === null || !targets.length) {
            throw new Error("Target node not found.");
        }
        for (let i = 0; i < targets.length; i++) {
            let target = targets[i];
            if (target === this.root) {
                this.root = null;
            } else {
                target.parent.delete(target);
            }
        }
    };

    this.search = function (key) {
        return key !== undefined && this.root ? this.root.search(key) : null;
    };

    this.traverse = function () {
        if (this.root !== null) {
            let queue = [this.root];
            let levels = [];
            let level = [];
            for (let i = 1, j = 0; queue.length; ) {
                let pointer = queue.shift();
                level.push(pointer);
                j += pointer.children.length;
                if (!--i) {
                    i = j;
                    j = 0;
                    levels.push(level);
                    level = [];
                }
                queue = queue.concat(pointer.children);
            }
            return levels;
        }
        return [];
    };
}

function TreeNode(key, properties) {
    this.key = key;
    this.parent = null;
    this.children = [];

    properties = properties && typeof properties === "object" ? properties : {};
    for (let i in properties) {
        this[i] = properties[i];
    }

    this.insert = function (child) {
        this.children.push(child);
        child.parent = this;
    };

    this.delete = function (child) {
        this.children.splice(this.children.indexOf(child), 1);
    };

    this.search = function (key) {
        let results = this.key.match("^" + key.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$") ? [this] : [];
        for (let i in this.children) {
            results = results.concat(this.children[i].search(key));
        }
        return results;
    };

    this.find = function (key) {
        let results = [];
        for (let i in this.children) {
            if (this.children[i].key.match( "^" + key.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$")) {
                results.push(this.children[i]);
            }
        }
        return results;
    };
}
