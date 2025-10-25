import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Chatbot from '../components/Chatbot';

function AwarenessHub() {
  const [posts, setPosts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [user, setUser] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'general',
    tags: '',
    featured: false
  });

  const categories = ['general', 'climate-change', 'recycling', 'energy', 'water-conservation', 'sustainable-living', 'green-technology'];

  useEffect(() => {
    fetchPosts();
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/users/verify-token');
        if (response.data.valid) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get('/awareness');
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching awareness posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to add posts');
        return;
      }

      const postData = {
        ...newPost,
        tags: newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await api.post('/awareness', postData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPosts([response.data.post, ...posts]);
        setNewPost({
          title: '',
          excerpt: '',
          content: '',
          category: 'general',
          tags: '',
          featured: false
        });
        setShowAddForm(false);
        alert('Post added successfully!');
      }
    } catch (error) {
      console.error('Error adding post:', error);
      alert(error.response?.data?.message || 'Failed to add post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to like posts');
        return;
      }

      const response = await api.put(`/awareness/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, engagement: response.data.engagement }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'climate-change': 'bg-red-100 text-red-800',
      'recycling': 'bg-green-100 text-green-800',
      'energy': 'bg-yellow-100 text-yellow-800',
      'water-conservation': 'bg-blue-100 text-blue-800',
      'sustainable-living': 'bg-purple-100 text-purple-800',
      'green-technology': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading awareness posts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Awareness Hub</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            {showAddForm ? 'Cancel' : 'Add Post'}
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Add Post Form */}
      {isAdmin && showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Awareness Post</h2>
          <form onSubmit={handleAddPost} className="space-y-4">
            <input
              type="text"
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={newPost.category}
                onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newPost.tags}
                onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                className="p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <textarea
              placeholder="Short excerpt/summary"
              value={newPost.excerpt}
              onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows="2"
              required
            />
            <textarea
              placeholder="Full content"
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows="6"
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={newPost.featured}
                onChange={(e) => setNewPost({...newPost, featured: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="featured" className="text-gray-700">Featured Post</label>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Publish Post
            </button>
          </form>
        </div>
      )}

      {/* Posts Grid */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No awareness posts found.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                    {post.featured && (
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(post.category)}`}>
                      {post.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      By {post.author?.fullName || 'Admin'} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{post.excerpt}</p>
              
              <div className="prose max-w-none mb-4">
                <div className="text-gray-800 whitespace-pre-line">
                  {post.content.length > 300 
                    ? `${post.content.substring(0, 300)}...` 
                    : post.content
                  }
                </div>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>👁️ {post.engagement?.views || 0} views</span>
                  <span>💬 {post.engagement?.comments || 0} comments</span>
                </div>
                <button
                  onClick={() => handleLikePost(post._id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>👍</span>
                  <span className="text-sm">{post.engagement?.likes || 0}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* EcoBot - Central Chatbot */}
      <div className="mt-8">
        <Chatbot />
      </div>
    </div>
  );
}

export default AwarenessHub;